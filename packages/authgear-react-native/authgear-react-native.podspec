require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "authgear-react-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = "authgear-react-native"
  s.homepage     = "https://github.com/authgear/authgear-sdk-js"
  s.license      = "MIT"
  s.platforms    = { :ios => "10.0" }
  s.authors      = { 'Louis Chan' => 'louischan@oursky.com' }
  s.summary      = "authgear-react-native"
  s.source       = { :git => 'https://github.com/authgear/authgear-sdk-js.git' }

  s.source_files = "ios/**/*.{h,m,mm}"

  s.dependency "React-Core"

  # Don't install the dependencies when we run `pod install` in the old architecture.
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
    s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig    = {
        "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
        "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
    }

    s.dependency "React-Codegen"
    s.dependency "RCT-Folly", folly_version
    s.dependency "RCTRequired"
    s.dependency "RCTTypeSafety"
    s.dependency "ReactCommon/turbomodule/core"
  end
end
