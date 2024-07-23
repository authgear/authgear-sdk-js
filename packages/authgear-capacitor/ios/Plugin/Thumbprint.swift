import CommonCrypto
import Foundation

// Reference: https://github.com/airsidemobile/JOSESwift/blob/master/JOSESwift/Sources/CryptoImplementation/Thumbprint.swift#L47

enum JWKThumbprintAlgorithm: String {
    case SHA256
}

private extension JWKThumbprintAlgorithm {
    var outputLenght: Int {
        switch self {
        case .SHA256:
            return Int(CC_SHA256_DIGEST_LENGTH)
        }
    }

    func calculate(input: UnsafeRawBufferPointer, output: UnsafeMutablePointer<UInt8>) {
        switch self {
        case .SHA256:
            CC_SHA256(input.baseAddress, CC_LONG(input.count), output)
        }
    }
}

enum Thumbprint {
    /// Calculates a hash of an input with a specific hash algorithm.
    ///
    /// - Parameters:
    ///   - input: The input to calculate a hash for.
    ///   - algorithm: The algorithm used to calculate the hash.
    /// - Returns: The calculated hash in base64URLEncoding.
    static func calculate(from input: Data, algorithm: JWKThumbprintAlgorithm) throws -> String {
        guard !input.isEmpty else {
            throw AuthgearError.runtimeError(AuthgearRuntimeError(message: "input must be > 0"))
        }

        let hashBytes = UnsafeMutablePointer<UInt8>.allocate(capacity: algorithm.outputLenght)
        defer { hashBytes.deallocate() }

        input.withUnsafeBytes { buffer in
            algorithm.calculate(input: buffer, output: hashBytes)
        }

        return Data(bytes: hashBytes, count: algorithm.outputLenght).base64urlEncodedString()
    }
}

extension Dictionary where Key == String, Value == Any {
    func computeThumbprint(algorithm: JWKThumbprintAlgorithm) throws -> String {
        guard let kty = self["kty"] as? String else {
            throw AuthgearError.runtimeError(AuthgearRuntimeError(message: "failed to compute thumbprint: invalid kty"))
        }
        var p: [String: String] = [:]
        p["kty"] = kty
        switch kty {
        case "EC":
            if let crv = self["crv"] as? String {
                p["crv"] = crv
            }
            if let x = self["x"] as? String {
                p["x"] = x
            }
            if let y = self["y"] as? String {
                p["y"] = y
            }
        case "RS":
            if let n = self["n"] as? String {
                p["n"] = n
            }
            if let e = self["e"] as? String {
                p["e"] = e
            }
        default:
            throw AuthgearError.runtimeError(AuthgearRuntimeError(message: "failed to compute thumbprint: unknown kty"))
        }
        guard let json = try? JSONSerialization.data(withJSONObject: p, options: .sortedKeys) else {
            throw AuthgearError.runtimeError(AuthgearRuntimeError(message: "failed to compute thumbprint: failed to serialize json"))
        }
        return try Thumbprint.calculate(from: json, algorithm: algorithm)
    }
}
