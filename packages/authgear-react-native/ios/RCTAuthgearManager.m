#import "RCTAuthgearManager.h"

#import "AGAuthgearReactNative.h"

@implementation RCTAuthgearManager

RCT_EXPORT_MODULE(AuthgearManager)

- (void)startObserving
{
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleOpenURLNotification:)
                                                 name:kOpenWechatRedirectURINotification
                                               object:nil];
}

- (void)stopObserving
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"onAuthgearOpenWechatRedirectURI"];
}

- (void)handleOpenURLNotification:(NSNotification *)notification
{
    [self sendEventWithName:@"onAuthgearOpenWechatRedirectURI" body:notification.userInfo[@"url"]];
}

@end
