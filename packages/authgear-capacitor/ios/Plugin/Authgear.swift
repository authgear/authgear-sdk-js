import Foundation

@objc public class Authgear: NSObject {
    @objc public func echo(_ value: String) -> String {
        print(value)
        return value
    }
}
