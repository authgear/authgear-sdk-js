#import "AGWKWebViewController.h"

NSErrorDomain const AGWKWebViewControllerErrorDomain = @"AGWKWebViewController";
NSInteger const AGWKWebViewControllerErrorCodeCanceledLogin = 1;

@interface AGWKWebViewController ()

@property (nonatomic, copy) NSURL* url;
@property (nonatomic, copy) NSURL* redirectURI;
@property (nonatomic, copy) AGWKWebViewControllerCompletionHandler completionHandler;
@property (nonatomic) WKWebView *webView;
@property (nonatomic, copy) NSURL* result;

@end

@implementation AGWKWebViewController

- (instancetype)initWithURL:(NSURL *)url redirectURI:(NSURL *)redirectURI completionHandler:(void (^)(NSURL *url, NSError *error))completionHandler
{
    self = [super initWithNibName:nil bundle:nil];
    self.url = url;
    self.redirectURI = redirectURI;
    self.completionHandler = completionHandler;

    WKWebViewConfiguration *configuration = [[WKWebViewConfiguration alloc] init];

    // Inject `user-select: none` style
    WKUserContentController *controller = [[WKUserContentController alloc] init];
    NSString *disableUserSelectScript =
        @"document.documentElement.style.webkitUserSelect = 'none';"
        "document.documentElement.style.userSelect = 'none';";
    WKUserScript *userScript = [[WKUserScript alloc] initWithSource:disableUserSelectScript injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:NO];
    [controller addUserScript:userScript];
    configuration.userContentController = controller;

    self.webView = [[WKWebView alloc] initWithFrame:CGRectZero configuration:configuration];
    self.webView.translatesAutoresizingMaskIntoConstraints = false;
    self.webView.allowsBackForwardNavigationGestures = YES;
    self.webView.navigationDelegate = self;

    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];

    // Configure layout
    [self.view addSubview: self.webView];
    if (@available(iOS 11.0, *)) {
        // Extend the web view to the top edge of the screen.
        // WKWebView magically offset the content so that the content is not covered by the navigation bar initially.
        [self.webView.topAnchor constraintEqualToAnchor:self.view.topAnchor].active = YES;
        [self.webView.leadingAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.leadingAnchor].active = YES;
        [self.webView.trailingAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.trailingAnchor].active = YES;
            // Extend the web view to the bottom edge of the screen.
        [self.webView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor].active = YES;
    }

    // Configure the bounce behavior
    self.webView.scrollView.bounces = NO;
    self.webView.scrollView.alwaysBounceVertical = NO;
    self.webView.scrollView.alwaysBounceHorizontal = NO;

    // Configure navigation bar appearance
    if (@available(iOS 13.0, *)) {
        UINavigationBarAppearance *appearance = [[UINavigationBarAppearance alloc] init];
        [appearance configureWithTransparentBackground];
        if (self.navigationBarBackgroundColor != nil) {
            appearance.backgroundColor = self.navigationBarBackgroundColor;
        }
        self.navigationItem.standardAppearance = appearance;
        self.navigationItem.compactAppearance = appearance;
        self.navigationItem.scrollEdgeAppearance = appearance;
        if (@available(iOS 15.0, *)) {
            self.navigationItem.compactScrollEdgeAppearance = appearance;
        }
    }

    // Configure back button
    self.navigationItem.hidesBackButton = YES;
    UIBarButtonItem *backButton;
    if (@available(iOS 13.0, *)) {
        UIImage *backButtonImage = [UIImage systemImageNamed:@"chevron.backward"];
        backButton = [[UIBarButtonItem alloc] initWithImage:backButtonImage style:UIBarButtonItemStylePlain target:self action:@selector(onTapBackButton)];
    } else {
        backButton = [[UIBarButtonItem alloc] initWithTitle:@"<" style:UIBarButtonItemStylePlain target:self action:@selector(onTapBackButton)];
    }
    if (self.navigationBarButtonTintColor != nil) {
        backButton.tintColor = self.navigationBarButtonTintColor;
    }
    self.navigationItem.leftBarButtonItem = backButton;

    // Configure close button
    UIBarButtonItem *closeButton;
    if (@available(iOS 13.0, *)) {
        UIImage *closeButtonImage = [UIImage systemImageNamed:@"xmark"];
        closeButton = [[UIBarButtonItem alloc] initWithImage:closeButtonImage style:UIBarButtonItemStylePlain target:self action:@selector(onTapCloseButton)];
    } else {
        closeButton = [[UIBarButtonItem alloc] initWithTitle:@"X" style:UIBarButtonItemStylePlain target:self action:@selector(onTapCloseButton)];
    }
    if (self.navigationBarButtonTintColor != nil) {
        closeButton.tintColor = self.navigationBarButtonTintColor;
    }
    self.navigationItem.rightBarButtonItem = closeButton;

    // Load URL
    NSURLRequest *request = [[NSURLRequest alloc] initWithURL:self.url];
    [self.webView loadRequest: request];
}

- (void)viewDidDisappear:(BOOL)animated
{
    [super viewDidDisappear:animated];

    // We only call completion handler here because
    // The view controller could be swiped to dismiss.
    // viewDidDisappear is the most rebust way to detect whether the view controller is dismissed.
    if (self.completionHandler != nil) {
        if (self.result != nil) {
            self.completionHandler(self.result, nil);
        } else {
            self.completionHandler(nil, [[NSError alloc] initWithDomain:AGWKWebViewControllerErrorDomain code:AGWKWebViewControllerErrorCodeCanceledLogin userInfo:nil]);
        }
    }
    self.completionHandler = nil;
}

- (void)onTapBackButton
{
    if (self.webView.canGoBack) {
        [self.webView goBack];
    } else {
        [self cancel];
    }
}

- (void)onTapCloseButton
{
    [self cancel];
}

- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler
{
    NSURL *navigationURL = navigationAction.request.URL;
    if (navigationURL != nil) {
        // Handle target="_blank" links
        if (navigationAction.targetFrame == nil) {
            if ([UIApplication.sharedApplication canOpenURL:navigationURL]) {
                [UIApplication.sharedApplication openURL:navigationURL options:@{} completionHandler:^(BOOL success) {
                    decisionHandler(WKNavigationActionPolicyCancel);
                }];
                return;
            }
        }
        // Handle redirect uri
        NSURLComponents *parts = [[NSURLComponents alloc] initWithURL:navigationURL resolvingAgainstBaseURL:NO];
        parts.query = nil;
        parts.fragment = nil;
        if ([parts.string isEqualToString:self.redirectURI.absoluteString]) {
            decisionHandler(WKNavigationActionPolicyCancel);
            self.result = navigationURL;
            [self dismissSelf];
            return;
        }
    }

    if (@available(iOS 14.5, *)) {
        if (navigationAction.shouldPerformDownload) {
            decisionHandler(WKNavigationActionPolicyDownload);
            return;
        } else {
            decisionHandler(WKNavigationActionPolicyAllow);
            return;
        }
    } else {
        decisionHandler(WKNavigationActionPolicyAllow);
        return;
    }
}

- (void)cancel
{
    [self dismissSelf];
}

- (void)start
{
    UIWindow *presentationAnchor = [self.presentationContextProvider presentationAnchorForAGWKWebViewController:self];
    UINavigationController *navigationController = [[UINavigationController alloc] initWithRootViewController:self];
    // Use the configured modal presentation style.
    navigationController.modalPresentationStyle = self.modalPresentationStyle;
    [presentationAnchor.rootViewController presentViewController:navigationController animated:YES completion:nil];
}

- (void)dismissSelf
{
    [self.navigationController.presentingViewController dismissViewControllerAnimated:YES completion:nil];
}

@end
