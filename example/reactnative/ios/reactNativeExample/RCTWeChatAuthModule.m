#import "RCTWeChatAuthModule.h"

#import <React/RCTUtils.h>
#import "WXApi.h"

@interface RCTWeChatAuthModule()
@property (nonatomic, strong) RCTPromiseResolveBlock sendWeChatAuthResolve;
@property (nonatomic, strong) RCTPromiseRejectBlock sendWeChatAuthReject;
@end

@implementation RCTWeChatAuthModule

RCT_EXPORT_MODULE(WeChatAuth);

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleWeChatAuthResult:)
                                                 name:kWeChatAuthResultNotification
                                               object:nil];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXPORT_METHOD(sendWechatAuthRequest:(NSString *)state
                                resolve:(RCTPromiseResolveBlock)resolve
                                 reject:(RCTPromiseRejectBlock)reject)
{
  self.sendWeChatAuthResolve = resolve;
  self.sendWeChatAuthReject = reject;

  SendAuthReq* req = [[SendAuthReq alloc] init];
  req.scope = @"snsapi_userinfo";
  req.state = state;
  [WXApi sendReq:req completion:nil];
}

- (void)handleWeChatAuthResult:(NSNotification *)notification
{
  if (notification.userInfo[@"code"]) {
    self.sendWeChatAuthResolve(notification.userInfo);
  } else {
    NSError * err = notification.userInfo[@"error"];
    NSString * errMessage = notification.userInfo[@"error_message"];
    self.sendWeChatAuthReject(RCTErrorUnspecified, errMessage, err);
  }
  [self cleanup];
}

- (void)cleanup
{
    self.sendWeChatAuthResolve = nil;
    self.sendWeChatAuthReject = nil;
}


@end
