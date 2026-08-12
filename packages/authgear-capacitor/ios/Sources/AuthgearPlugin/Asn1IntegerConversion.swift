// swiftforamt:disable all

import Foundation

// Copied from https://github.com/airsidemobile/JOSESwift/blob/2.4.0/JOSESwift/Sources/CryptoImplementation/EC.swift#L229
enum Asn1IntegerConversion {
    static func toRaw(_ data: Data, of fixedLength: Int) -> Data {
        let varLength = data.count
        if varLength > fixedLength + 1 {
            fatalError("ASN.1 integer is \(varLength) bytes long when it should be < \(fixedLength + 1).")
        }
        if varLength == fixedLength + 1 {
            assert(data.first == 0)
            return data.dropFirst()
        }
        if varLength == fixedLength {
            return data
        }
        if varLength < fixedLength {
            // pad to fixed length using 0x00 bytes
            return Data(count: fixedLength - varLength) + data
        }
        fatalError("Unable to parse ASN.1 integer. This should be unreachable.")
    }

    static func fromRaw(_ data: Data) -> Data {
        assert(!data.isEmpty)
        let msb: UInt8 = 0b1000_0000
        // drop all leading zero bytes
        let varlen = data.drop { $0 == 0 }
        guard let firstNonZero = varlen.first else {
            // all bytes were zero so the encoded value is zero
            return Data(count: 1)
        }
        if (firstNonZero & msb) == msb {
            return Data(count: 1) + varlen
        }
        return varlen
    }
}
