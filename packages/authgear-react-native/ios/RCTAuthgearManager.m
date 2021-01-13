#import "RCTAuthgearManager.h"

#import "AGAuthgearReactNative.h"

@implementation RCTAuthgearManager

RCT_EXPORT_MODULE(AuthgearManager)

- (void)startObserving
{
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleOpenURLNotification:)
                                                 name:kOpenURLNotification
                                               object:nil];
}

- (void)stopObserving
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"onAuthgearDeepLink"];
}

- (void)handleOpenURLNotification:(NSNotification *)notification
{
    [self sendEventWithName:@"onAuthgearDeepLink" body:notification.userInfo[@"url"]];
}

@end
