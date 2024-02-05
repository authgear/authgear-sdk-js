#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

extern NSErrorDomain const AGWKWebViewControllerErrorDomain;
extern NSInteger const AGWKWebViewControllerErrorCodeCanceledLogin;


typedef void(^AGWKWebViewControllerCompletionHandler)(NSURL *url, NSError *error);


@class AGWKWebViewController;


@protocol AGWKWebViewControllerPresentationContextProviding <NSObject>

- (UIWindow *)presentationAnchorForAGWKWebViewController:(AGWKWebViewController *)controller;

@end


@interface AGWKWebViewController : UIViewController <WKNavigationDelegate>

- (instancetype)initWithURL:(NSURL *)url redirectURI:(NSURL *)redirectURI completionHandler:(AGWKWebViewControllerCompletionHandler) completionHandler;

@property (nonatomic, weak) id<AGWKWebViewControllerPresentationContextProviding> presentationContextProvider;
@property (nonatomic, copy) UIColor *backgroundColor;
@property (nonatomic, copy) UIColor *navigationBarBackgroundColor;
@property (nonatomic, copy) UIColor *navigationBarButtonTintColor;

- (void)cancel;
- (void)start;

@end
