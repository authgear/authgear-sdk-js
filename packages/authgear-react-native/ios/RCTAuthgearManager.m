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

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeTestSpecJSI>(params);
}
#endif

@end
