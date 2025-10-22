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

  install_modules_dependencies(s)
end
