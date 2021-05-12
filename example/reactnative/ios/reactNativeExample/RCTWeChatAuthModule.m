#import "RCTWechatAuthModule.h"

#import <React/RCTUtils.h>
#import "WXApi.h"

@interface RCTWechatAuthModule()
@property (nonatomic, strong) RCTPromiseResolveBlock sendWechatAuthResolve;
@property (nonatomic, strong) RCTPromiseRejectBlock sendWechatAuthReject;
@end

@implementation RCTWechatAuthModule

RCT_EXPORT_MODULE(WechatAuth);

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleWechatAuthResult:)
                                                 name:kWechatAuthResultNotification
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
  self.sendWechatAuthResolve = resolve;
  self.sendWechatAuthReject = reject;

  SendAuthReq* req = [[SendAuthReq alloc] init];
  req.scope = @"snsapi_userinfo";
  req.state = state;
  [WXApi sendReq:req completion:nil];
}

- (void)handleWechatAuthResult:(NSNotification *)notification
{
  if (notification.userInfo[@"code"]) {
    self.sendWechatAuthResolve(notification.userInfo);
  } else {
    NSError * err = notification.userInfo[@"error"];
    NSString * errMessage = notification.userInfo[@"error_message"];
    self.sendWechatAuthReject(RCTErrorUnspecified, errMessage, err);
  }
  [self cleanup];
}

- (void)cleanup
{
    self.sendWechatAuthResolve = nil;
    self.sendWechatAuthReject = nil;
}


@end
