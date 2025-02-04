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

  # The iOS native module is compatible with the Interop layer.
  # But it is itself not a TurboModule.
  # Converting to a TurboModule requires
  # 1. Figure out how to emit events in the old way and the new way.
  # 2. Write the codegen spec javascript file.
  # 3. Configure codegenConfig in package.json (Once we do this, the codegen config in build.gradle should be removed)
  # 4. Make necessary changes to the native code to conform to the spec.
  s.dependency "React-Core"
end
