use std::{
    env, fs,
    path::{Path, PathBuf},
    println,
};

#[cfg(all(target_os = "linux", feature = "linux-pkg-config"))]
fn link_pkg_config(name: &str) -> Vec<PathBuf> {
    // sometimes an override is needed
    let pc_name = match name {
        "libvpx" => "vpx",
        _ => name,
    };
    let lib = pkg_config::probe_library(pc_name)
        .expect(format!(
            "unable to find '{pc_name}' development headers with pkg-config (feature linux-pkg-config is enabled).
            try installing '{pc_name}-dev' from your system package manager.").as_str());

    lib.include_paths
}
#[cfg(not(all(target_os = "linux", feature = "linux-pkg-config")))]
fn link_pkg_config(_name: &str) -> Vec<PathBuf> {
    unimplemented!()
}

/// Link vcpkg package.
fn link_vcpkg(mut path: PathBuf, name: &str) -> PathBuf {
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap();
    let mut target_arch = std::env::var("CARGO_CFG_TARGET_ARCH").unwrap();
    if target_arch == "x86_64" {
        target_arch = "x64".to_owned();
    } else if target_arch == "x86" {
        target_arch = "x86".to_owned();
    } else if target_arch == "loongarch64" {
        target_arch = "loongarch64".to_owned();
    } else if target_arch == "aarch64" {
        target_arch = "arm64".to_owned();
    } else {
        target_arch = "arm".to_owned();
    }
    let mut target = if target_os == "macos" {
        if target_arch == "x64" {
            "x64-osx".to_owned()
        } else if target_arch == "arm64" {
            "arm64-osx".to_owned()
        } else {
            format!("{}-{}", target_arch, target_os)
        }
    } else if target_os == "windows" {
        "x64-windows-static".to_owned()
    } else {
        format!("{}-{}", target_arch, target_os)
    };
    if target_arch == "x86" {
        target = target.replace("x64", "x86");
    }
    println!("cargo:info={}", target);
    if let Ok(vcpkg_root) = std::env::var("VCPKG_INSTALLED_ROOT") {
        path = vcpkg_root.into();
    } else {
        path.push("installed");
    }
    path.push(target);
    println!(
        "cargo:rustc-link-lib=static={}",
        name.trim_start_matches("lib")
    );
    println!(
        "cargo:rustc-link-search={}",
        path.join("lib").to_str().unwrap()
    );
    let include = path.join("include");
    println!("cargo:include={}", include.to_str().unwrap());
    include
}

/// Link homebrew package(for Mac M1).
fn link_homebrew_m1(name: &str) -> PathBuf {
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap();
    let target_arch = std::env::var("CARGO_CFG_TARGET_ARCH").unwrap();
    if target_os != "macos" || target_arch != "aarch64" {
        panic!("Couldn't find VCPKG_ROOT, also can't fallback to homebrew because it's only for macos aarch64.");
    }
    let mut path = PathBuf::from("/opt/homebrew/Cellar");
    path.push(name);
    let entries = if let Ok(dir) = std::fs::read_dir(&path) {
        dir
    } else {
        panic!("Could not find package in {}. Make sure your homebrew and package {} are all installed.", path.to_str().unwrap(),&name);
    };
    let mut directories = entries
        .into_iter()
        .filter(|x| x.is_ok())
        .map(|x| x.unwrap().path())
        .filter(|x| x.is_dir())
        .collect::<Vec<_>>();
    // Find the newest version.
    directories.sort_unstable();
    if directories.is_empty() {
        panic!(
            "There's no installed version of {} in /opt/homebrew/Cellar",
            name
        );
    }
    path.push(directories.pop().unwrap());
    // Link the library.
    println!(
        "cargo:rustc-link-lib=static={}",
        name.trim_start_matches("lib")
    );
    // Add the library path.
    println!(
        "cargo:rustc-link-search={}",
        path.join("lib").to_str().unwrap()
    );
    // Add the include path.
    let include = path.join("include");
    println!("cargo:include={}", include.to_str().unwrap());
    include
}

/// Find package. By default, it will try to find vcpkg first, then homebrew(currently only for Mac M1).
/// If building for linux and feature "linux-pkg-config" is enabled, will try to use pkg-config
/// unless check fails (e.g. NO_PKG_CONFIG_libyuv=1)
fn find_package(name: &str) -> Vec<PathBuf> {
    let no_pkg_config_var_name = format!("NO_PKG_CONFIG_{name}");
    println!("cargo:rerun-if-env-changed={no_pkg_config_var_name}");
    if cfg!(all(target_os = "linux", feature = "linux-pkg-config"))
        && std::env::var(no_pkg_config_var_name).as_deref() != Ok("1")
    {
        link_pkg_config(name)
    } else if let Ok(vcpkg_root) = std::env::var("VCPKG_ROOT") {
        vec![link_vcpkg(vcpkg_root.into(), name)]
    } else {
        // Try using homebrew
        vec![link_homebrew_m1(name)]
    }
}

fn generate_bindings(
    ffi_header: &Path,
    include_paths: &[PathBuf],
    ffi_rs: &Path,
    exact_file: &Path,
    regex: &str,
) {
    let mut b = bindgen::builder()
        .header(ffi_header.to_str().unwrap())
        .allowlist_type(regex)
        .allowlist_var(regex)
        .allowlist_function(regex)
        .rustified_enum(regex)
        .trust_clang_mangling(false)
        .layout_tests(false) // breaks 32/64-bit compat
        .generate_comments(false); // comments have prefix /*!\

    for dir in include_paths {
        b = b.clang_arg(format!("-I{}", dir.display()));
    }

    b.generate().unwrap().write_to_file(ffi_rs).unwrap();

    // Post-process: fix structs that LLVM 22 causes bindgen to generate as opaque.
    // Forward-declared structs leave their layout unresolved in the bindgen IR with LLVM 22.
    if ffi_rs.file_name().map(|n| n == "vpx_ffi.rs").unwrap_or(false) {
        fix_opaque_vpx_structs(ffi_rs);
    }
    if ffi_rs.file_name().map(|n| n == "aom_ffi.rs").unwrap_or(false) {
        fix_opaque_aom_structs(ffi_rs);
    }

    fs::copy(ffi_rs, exact_file).ok(); // ignore failure
}

/// Replace bindgen-generated opaque stubs for vpx_codec_enc_cfg / vpx_codec_dec_cfg
/// with correct #[repr(C)] definitions extracted from the installed vcpkg headers.
fn fix_opaque_vpx_structs(path: &Path) {
    let content = fs::read_to_string(path).expect("cannot read vpx_ffi.rs");
    if !content.contains("pub _address: u8") {
        return; // nothing to fix
    }

    let enc_correct = r#"#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct vpx_codec_enc_cfg {
    pub g_usage: u32,
    pub g_threads: u32,
    pub g_profile: u32,
    pub g_w: u32,
    pub g_h: u32,
    pub g_bit_depth: vpx_bit_depth_t,
    pub g_input_bit_depth: u32,
    pub g_timebase: vpx_rational,
    pub g_error_resilient: vpx_codec_er_flags_t,
    pub g_pass: vpx_enc_pass,
    pub g_lag_in_frames: u32,
    pub rc_dropframe_thresh: u32,
    pub rc_resize_allowed: u32,
    pub rc_scaled_width: u32,
    pub rc_scaled_height: u32,
    pub rc_resize_up_thresh: u32,
    pub rc_resize_down_thresh: u32,
    pub rc_end_usage: vpx_rc_mode,
    pub rc_twopass_stats_in: vpx_fixed_buf,
    pub rc_firstpass_mb_stats_in: vpx_fixed_buf,
    pub rc_target_bitrate: u32,
    pub rc_min_quantizer: u32,
    pub rc_max_quantizer: u32,
    pub rc_undershoot_pct: u32,
    pub rc_overshoot_pct: u32,
    pub rc_buf_sz: u32,
    pub rc_buf_initial_sz: u32,
    pub rc_buf_optimal_sz: u32,
    pub rc_2pass_vbr_bias_pct: u32,
    pub rc_2pass_vbr_minsection_pct: u32,
    pub rc_2pass_vbr_maxsection_pct: u32,
    pub rc_2pass_vbr_corpus_complexity: u32,
    pub kf_mode: vpx_kf_mode,
    pub kf_min_dist: u32,
    pub kf_max_dist: u32,
    pub ss_number_layers: u32,
    pub ss_enable_auto_alt_ref: [::std::os::raw::c_int; 5usize],
    pub ss_target_bitrate: [u32; 5usize],
    pub ts_number_layers: u32,
    pub ts_target_bitrate: [u32; 5usize],
    pub ts_rate_decimator: [u32; 5usize],
    pub ts_periodicity: u32,
    pub ts_layer_id: [u32; 16usize],
    pub layer_target_bitrate: [u32; 12usize],
    pub temporal_layering_mode: ::std::os::raw::c_int,
    pub use_vizier_rc_params: ::std::os::raw::c_int,
    pub active_wq_factor: vpx_rational,
    pub err_per_mb_factor: vpx_rational,
    pub sr_default_decay_limit: vpx_rational,
    pub sr_diff_factor: vpx_rational,
    pub kf_err_per_mb_factor: vpx_rational,
    pub kf_frame_min_boost_factor: vpx_rational,
    pub kf_frame_max_boost_first_factor: vpx_rational,
    pub kf_frame_max_boost_subs_factor: vpx_rational,
    pub kf_max_total_boost_factor: vpx_rational,
    pub gf_max_total_boost_factor: vpx_rational,
    pub gf_frame_max_boost_factor: vpx_rational,
    pub zm_factor: vpx_rational,
    pub rd_mult_inter_qp_fac: vpx_rational,
    pub rd_mult_arf_qp_fac: vpx_rational,
    pub rd_mult_key_qp_fac: vpx_rational,
}"#;

    let dec_correct = r#"#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct vpx_codec_dec_cfg {
    pub threads: u32,
    pub w: u32,
    pub h: u32,
}"#;

    // Replace opaque stubs (with any preceding #[repr]/#[derive] attributes)
    let re_enc = regex::Regex::new(
        r"(?:#\[[^\]]*\]\s*)*pub struct vpx_codec_enc_cfg \{\s*pub _address: u8,\s*\}"
    ).unwrap();
    let re_dec = regex::Regex::new(
        r"(?:#\[[^\]]*\]\s*)*pub struct vpx_codec_dec_cfg \{\s*pub _address: u8,\s*\}"
    ).unwrap();

    let fixed = re_enc.replace(&content, enc_correct);
    let fixed = re_dec.replace(&fixed, dec_correct);

    fs::write(path, fixed.as_ref()).expect("cannot write fixed vpx_ffi.rs");
}

/// Replace opaque stubs in aom_ffi.rs: cfg_options and aom_codec_enc_cfg.
fn fix_opaque_aom_structs(path: &Path) {
    let content = fs::read_to_string(path).expect("cannot read aom_ffi.rs");
    if !content.contains("pub _address: u8") {
        return;
    }

    let cfg_correct = r#"#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct cfg_options {
    pub init_by_cfg_file: u32,
    pub super_block_size: u32,
    pub max_partition_size: u32,
    pub min_partition_size: u32,
    pub disable_ab_partition_type: u32,
    pub disable_rect_partition_type: u32,
    pub disable_1to4_partition_type: u32,
    pub disable_flip_idtx: u32,
    pub disable_cdef: u32,
    pub disable_lr: u32,
    pub disable_obmc: u32,
    pub disable_warp_motion: u32,
    pub disable_global_motion: u32,
    pub disable_dist_wtd_comp: u32,
    pub disable_diff_wtd_comp: u32,
    pub disable_inter_intra_comp: u32,
    pub disable_masked_comp: u32,
    pub disable_one_sided_comp: u32,
    pub disable_palette: u32,
    pub disable_intrabc: u32,
    pub disable_cfl: u32,
    pub disable_smooth_intra: u32,
    pub disable_filter_intra: u32,
    pub disable_dual_filter: u32,
    pub disable_intra_angle_delta: u32,
    pub disable_intra_edge_filter: u32,
    pub disable_tx_64x64: u32,
    pub disable_smooth_inter_intra: u32,
    pub disable_inter_inter_wedge: u32,
    pub disable_inter_intra_wedge: u32,
    pub disable_paeth_intra: u32,
    pub disable_trellis_quant: u32,
    pub disable_ref_frame_mv: u32,
    pub reduced_reference_set: u32,
    pub reduced_tx_type_set: u32,
}"#;

    let enc_correct = r#"#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct aom_codec_enc_cfg {
    pub g_usage: u32,
    pub g_threads: u32,
    pub g_profile: u32,
    pub g_w: u32,
    pub g_h: u32,
    pub g_limit: u32,
    pub g_forced_max_frame_width: u32,
    pub g_forced_max_frame_height: u32,
    pub g_bit_depth: aom_bit_depth_t,
    pub g_input_bit_depth: u32,
    pub g_timebase: aom_rational,
    pub g_error_resilient: aom_codec_er_flags_t,
    pub g_pass: aom_enc_pass,
    pub g_lag_in_frames: u32,
    pub rc_dropframe_thresh: u32,
    pub rc_resize_mode: u32,
    pub rc_resize_denominator: u32,
    pub rc_resize_kf_denominator: u32,
    pub rc_superres_mode: aom_superres_mode,
    pub rc_superres_denominator: u32,
    pub rc_superres_kf_denominator: u32,
    pub rc_superres_qthresh: u32,
    pub rc_superres_kf_qthresh: u32,
    pub rc_end_usage: aom_rc_mode,
    pub rc_twopass_stats_in: aom_fixed_buf,
    pub rc_firstpass_mb_stats_in: aom_fixed_buf,
    pub rc_target_bitrate: u32,
    pub rc_min_quantizer: u32,
    pub rc_max_quantizer: u32,
    pub rc_undershoot_pct: u32,
    pub rc_overshoot_pct: u32,
    pub rc_buf_sz: u32,
    pub rc_buf_initial_sz: u32,
    pub rc_buf_optimal_sz: u32,
    pub rc_2pass_vbr_bias_pct: u32,
    pub rc_2pass_vbr_minsection_pct: u32,
    pub rc_2pass_vbr_maxsection_pct: u32,
    pub fwd_kf_enabled: ::std::os::raw::c_int,
    pub kf_mode: aom_kf_mode,
    pub kf_min_dist: u32,
    pub kf_max_dist: u32,
    pub sframe_dist: u32,
    pub sframe_mode: u32,
    pub large_scale_tile: u32,
    pub monochrome: u32,
    pub full_still_picture_hdr: u32,
    pub save_as_annexb: u32,
    pub tile_width_count: ::std::os::raw::c_int,
    pub tile_height_count: ::std::os::raw::c_int,
    pub tile_widths: [::std::os::raw::c_int; 64usize],
    pub tile_heights: [::std::os::raw::c_int; 64usize],
    pub use_fixed_qp_offsets: u32,
    pub fixed_qp_offsets: [::std::os::raw::c_int; 5usize],
    pub encoder_cfg: cfg_options,
}"#;

    let dec_correct = r#"#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct aom_codec_dec_cfg {
    pub threads: u32,
    pub w: u32,
    pub h: u32,
    pub allow_lowbitdepth: u32,
}"#;

    // cfg_options is not emitted by bindgen (regex filters it out); inject it
    // right before aom_codec_enc_cfg which depends on it.
    let enc_with_cfg = format!("{}\n\n{}", cfg_correct, enc_correct);

    let re_dec = regex::Regex::new(
        r"(?:#\[[^\]]*\]\s*)*pub struct aom_codec_dec_cfg \{\s*pub _address: u8,\s*\}"
    ).unwrap();
    let re_enc = regex::Regex::new(
        r"(?:#\[[^\]]*\]\s*)*pub struct aom_codec_enc_cfg \{\s*pub _address: u8,\s*\}"
    ).unwrap();

    let fixed = re_dec.replace(&content, dec_correct);
    let fixed = re_enc.replace(&fixed, enc_with_cfg.as_str());

    fs::write(path, fixed.as_ref()).expect("cannot write fixed aom_ffi.rs");
}

fn gen_vcpkg_package(package: &str, ffi_header: &str, generated: &str, regex: &str) {
    let includes = find_package(package);
    let src_dir = env::var_os("CARGO_MANIFEST_DIR").unwrap();
    let src_dir = Path::new(&src_dir);
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let out_dir = Path::new(&out_dir);

    let ffi_header = src_dir.join("src").join("bindings").join(ffi_header);
    println!("rerun-if-changed={}", ffi_header.display());
    for dir in &includes {
        println!("rerun-if-changed={}", dir.display());
    }

    let ffi_rs = out_dir.join(generated);
    let exact_file = src_dir.join("generated").join(generated);
    generate_bindings(&ffi_header, &includes, &ffi_rs, &exact_file, regex);
}

// If you have problems installing ffmpeg, you can download $VCPKG_ROOT/installed from ci
// Linux require link in hwcodec
/*
fn ffmpeg() {
    // ffmpeg
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap();
    let target_arch = std::env::var("CARGO_CFG_TARGET_ARCH").unwrap();
    let static_libs = vec!["avcodec", "avutil", "avformat"];
    static_libs.iter().for_each(|lib| {
        find_package(lib);
    });
    if target_os == "windows" {
        println!("cargo:rustc-link-lib=static=libmfx");
    }

    // os
    let dyn_libs: Vec<&str> = if target_os == "windows" {
        ["User32", "bcrypt", "ole32", "advapi32"].to_vec()
    } else if target_os == "linux" {
        let mut v = ["va", "va-drm", "va-x11", "vdpau", "X11", "stdc++"].to_vec();
        if target_arch == "x86_64" {
            v.push("z");
        }
        v
    } else if target_os == "macos" || target_os == "ios" {
        ["c++", "m"].to_vec()
    } else if target_os == "android" {
        ["z", "m", "android", "atomic"].to_vec()
    } else {
        panic!("unsupported os");
    };
    dyn_libs
        .iter()
        .map(|lib| println!("cargo:rustc-link-lib={}", lib))
        .count();

    if target_os == "macos" || target_os == "ios" {
        println!("cargo:rustc-link-lib=framework=CoreFoundation");
        println!("cargo:rustc-link-lib=framework=CoreVideo");
        println!("cargo:rustc-link-lib=framework=CoreMedia");
        println!("cargo:rustc-link-lib=framework=VideoToolbox");
        println!("cargo:rustc-link-lib=framework=AVFoundation");
    }
}
*/

fn main() {
    // in this crate, these are also valid configurations
    println!("cargo:rustc-check-cfg=cfg(dxgi,quartz,x11)");

    // there is problem with cfg(target_os) in build.rs, so use our workaround
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap();

    // note: all link symbol names in x86 (32-bit) are prefixed wth "_".
    // run "rustup show" to show current default toolchain, if it is stable-x86-pc-windows-msvc,
    // please install x64 toolchain by "rustup toolchain install stable-x86_64-pc-windows-msvc",
    // then set x64 to default by "rustup default stable-x86_64-pc-windows-msvc"
    let target = target_build_utils::TargetInfo::new();
    if target.unwrap().target_pointer_width() != "64" {
        // panic!("Only support 64bit system");
    }
    env::remove_var("CARGO_CFG_TARGET_FEATURE");
    env::set_var("CARGO_CFG_TARGET_FEATURE", "crt-static");

    find_package("libyuv");
    gen_vcpkg_package("libvpx", "vpx_ffi.h", "vpx_ffi.rs", "^[vV].*");
    gen_vcpkg_package("aom", "aom_ffi.h", "aom_ffi.rs", "^(aom|AOM|OBU|AV1).*");
    gen_vcpkg_package("libyuv", "yuv_ffi.h", "yuv_ffi.rs", ".*");
    // ffmpeg();

    if target_os == "ios" {
        // nothing
    } else if target_os == "android" {
        println!("cargo:rustc-cfg=android");
    } else if cfg!(windows) {
        // The first choice is Windows because DXGI is amazing.
        println!("cargo:rustc-cfg=dxgi");
    } else if cfg!(target_os = "macos") {
        // Quartz is second because macOS is the (annoying) exception.
        println!("cargo:rustc-cfg=quartz");
    } else if cfg!(unix) {
        // On UNIX we pray that X11 (with XCB) is available.
        println!("cargo:rustc-cfg=x11");
    }
}
