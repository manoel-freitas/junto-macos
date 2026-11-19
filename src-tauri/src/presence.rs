#[derive(Debug, Clone, serde::Serialize)]
pub struct PresenceSnapshot {
    pub meeting: bool,
    pub focus: bool,
    pub active_app: String,
}

const MEETING_BUNDLE_PREFIXES: &[&str] = &[
    "us.zoom",
    "com.apple.FaceTime",
    "com.microsoft.teams",
    "com.cisco.webex",
    "com.skype",
];

#[cfg(target_os = "macos")]
pub fn snapshot() -> PresenceSnapshot {
    use cocoa::appkit::NSWorkspace;
    use cocoa::base::{id, nil};
    use objc::{class, msg_send, sel, sel_impl};

    unsafe {
        let workspace: id = msg_send![class!(NSWorkspace), sharedWorkspace];
        let app: id = msg_send![workspace, frontmostApplication];
        if app == nil {
            return PresenceSnapshot {
                meeting: false,
                focus: false,
                active_app: String::new(),
            };
        }
        let name_ns: id = msg_send![app, localizedName];
        let bundle_ns: id = msg_send![app, bundleIdentifier];
        let name = nsstring_to_string(name_ns);
        let bundle = nsstring_to_string(bundle_ns);
        let meeting = MEETING_BUNDLE_PREFIXES
            .iter()
            .any(|p| bundle.starts_with(p));
        PresenceSnapshot {
            meeting,
            focus: false,
            active_app: name,
        }
    }
}

#[cfg(target_os = "macos")]
unsafe fn nsstring_to_string(ns: cocoa::base::id) -> String {
    use cocoa::base::nil;
    use objc::{msg_send, sel, sel_impl};
    if ns == nil {
        return String::new();
    }
    let utf8: *const std::os::raw::c_char = msg_send![ns, UTF8String];
    if utf8.is_null() {
        return String::new();
    }
    std::ffi::CStr::from_ptr(utf8)
        .to_string_lossy()
        .into_owned()
}

#[cfg(not(target_os = "macos"))]
pub fn snapshot() -> PresenceSnapshot {
    PresenceSnapshot {
        meeting: false,
        focus: false,
        active_app: String::new(),
    }
}