import Foundation
import UIKit
import WebKit

let AGWKWebViewControllerErrorDomain: String = "AGWKWebViewController"
let AGWKWebViewControllerErrorCodeCanceledLogin: Int = 1

protocol AGWKWebViewControllerPresentationContextProviding: AnyObject {
    func presentationAnchor(for: AGWKWebViewController) -> UIWindow
}

class AGWKWebViewController: UIViewController, WKNavigationDelegate {
    typealias CompletionHandler = (URL?, Error?) -> Void

    weak var presentationContextProvider: AGWKWebViewControllerPresentationContextProviding?
    var backgroundColor: UIColor?
    var navigationBarBackgroundColor: UIColor?
    var navigationBarButtonTintColor: UIColor?

    private let url: URL
    private let redirectURI: URL
    private var completionHandler: CompletionHandler?
    private let webView: WKWebView
    private var result: URL?

    private var defaultBackgroundColor: UIColor {
        get {
            if #available(iOS 12.0, *) {
                switch (self.traitCollection.userInterfaceStyle) {
                case .dark:
                    return UIColor.black
                default:
                    return UIColor.white
                }
            }
            return UIColor.white
        }
    }

    init(url: URL, redirectURI: URL, completionHandler: @escaping CompletionHandler) {
        self.url = url
        self.redirectURI = redirectURI
        self.completionHandler = completionHandler

        let configuration = WKWebViewConfiguration()
        self.webView = WKWebView(frame: .zero, configuration: configuration)
        self.webView.translatesAutoresizingMaskIntoConstraints = false
        self.webView.allowsBackForwardNavigationGestures = true

        super.init(nibName: nil, bundle: nil)

        self.webView.navigationDelegate = self
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // Configure background color
        if let backgroundColor = self.backgroundColor {
            self.view.backgroundColor = backgroundColor
        } else {
            self.view.backgroundColor = self.defaultBackgroundColor
        }

        // Configure layout
        self.view.addSubview(self.webView)
        if #available(iOS 11.0, *) {
            // Extend the web view to the top edge of the screen.
            // WKWebView magically offset the content so that the content is not covered by the navigation bar initially.
            self.webView.topAnchor.constraint(equalTo: self.view.topAnchor).isActive = true
            self.webView.leadingAnchor.constraint(equalTo: self.view.safeAreaLayoutGuide.leadingAnchor).isActive = true
            self.webView.trailingAnchor.constraint(equalTo: self.view.safeAreaLayoutGuide.trailingAnchor).isActive = true
            // Extend the web view to the bottom edge of the screen.
            self.webView.bottomAnchor.constraint(equalTo: self.view.bottomAnchor).isActive = true
        }

        // Configure the bounce behavior
        self.webView.scrollView.bounces = false
        self.webView.scrollView.alwaysBounceVertical = false
        self.webView.scrollView.alwaysBounceHorizontal = false

        // Configure navigation bar appearance
        if #available(iOS 13.0, *) {
            let appearance = UINavigationBarAppearance()
            appearance.configureWithTransparentBackground()
            if let navigationBarBackgroundColor = self.navigationBarBackgroundColor {
                appearance.backgroundColor = navigationBarBackgroundColor
            }
            self.navigationItem.standardAppearance = appearance
            self.navigationItem.compactAppearance = appearance
            self.navigationItem.scrollEdgeAppearance = appearance
            if #available(iOS 15.0, *) {
                self.navigationItem.compactScrollEdgeAppearance = appearance
            }
        }

        // Configure back button
        self.navigationItem.hidesBackButton = true
        var backButton: UIBarButtonItem
        if #available(iOS 13.0, *) {
            let backButtonImage = UIImage(systemName: "chevron.backward")
            backButton = UIBarButtonItem(image: backButtonImage, style: .plain, target: self, action: #selector(onTapBackButton))
        } else {
            backButton = UIBarButtonItem(title: "<", style: .plain, target: self, action: #selector(onTapBackButton))
        }
        if let navigationBarButtonTintColor = self.navigationBarButtonTintColor {
            backButton.tintColor = navigationBarButtonTintColor
        }
        self.navigationItem.leftBarButtonItem = backButton

        // Configure close button
        var closeButton: UIBarButtonItem
        if #available(iOS 13.0, *) {
            let closeButtonImage = UIImage(systemName: "xmark")
            closeButton = UIBarButtonItem(image: closeButtonImage, style: .plain, target: self, action: #selector(onTapCloseButton))
        } else {
            closeButton = UIBarButtonItem(title: "X", style: .plain, target: self, action: #selector(onTapCloseButton))
        }
        if let navigationBarButtonTintColor = self.navigationBarButtonTintColor {
            closeButton.tintColor = navigationBarButtonTintColor
        }
        self.navigationItem.rightBarButtonItem = closeButton

        let request = URLRequest(url: self.url)
        self.webView.load(request)
    }

    override func viewDidDisappear(_ animated: Bool) {
        // We only call completion handler here because
        // The view controller could be swiped to dismiss.
        // viewDidDisappear is the most rebust way to detect whether the view controller is dismissed.
        if let result = self.result {
            self.completionHandler?(result, nil)
        } else {
            let err = NSError(domain: AGWKWebViewControllerErrorDomain, code: AGWKWebViewControllerErrorCodeCanceledLogin)
            self.completionHandler?(nil, err)
        }
        self.completionHandler = nil
    }

    @objc private func onTapBackButton() {
        if (self.webView.canGoBack) {
            _ = self.webView.goBack()
        } else {
            self.cancel()
        }
    }

    @objc private func onTapCloseButton() {
        self.cancel()
    }

    func cancel() {
        self.dismissSelf()
    }

    func start() {
        if let presentationAnchor = self.presentationContextProvider?.presentationAnchor(for: self) {
            let navigationController = UINavigationController(rootViewController: self)
            // Use the configured modal presentation style.
            navigationController.modalPresentationStyle = self.modalPresentationStyle
            presentationAnchor.rootViewController?.present(navigationController, animated: true)
        }
    }

    private func dismissSelf() {
        self.navigationController?.presentingViewController?.dismiss(animated: true)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let navigationURL = navigationAction.request.url {
            var parts = URLComponents(url: navigationURL, resolvingAgainstBaseURL: false)
            parts?.query = nil
            parts?.fragment = nil
            if let partsString = parts?.string {
                if partsString == self.redirectURI.absoluteString {
                    decisionHandler(.cancel)
                    self.result = navigationURL
                    self.dismissSelf()
                    return
                }
            }
        }

        if #available(iOS 14.5, *) {
            if navigationAction.shouldPerformDownload {
                decisionHandler(.download)
                return
            } else {
                decisionHandler(.allow)
                return
            }
        } else {
            decisionHandler(.allow)
            return
        }
    }
}
