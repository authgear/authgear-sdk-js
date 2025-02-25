require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'AuthgearCapacitor'
  s.version = package['version']
  s.summary = 'Authgear SDK for Capacitor'
  s.license = package['license']
  s.homepage = 'https://github.com/authgear/authgear-sdk-js'
  s.author = { 'Louis Chan' => 'louischan@oursky.com' }
  s.source = { :git => 'https://github.com/authgear/authgear-sdk-js.git' }
  s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target  = '14.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.1'
end
