public enum AuthgearError: LocalizedError {
    case runtimeError(Error)

    public var errorDescription: String? {
        var message = ""
        switch self {
        case let .runtimeError(err):
            message = err.localizedDescription
        }
        return "AuthgearError: \(message)"
    }
}

class AuthgearRuntimeError: LocalizedError {
    private let message: String

    init(message: String) {
        self.message = message
    }
    
    public var errorDescription: String? {
        return message
    }
}
