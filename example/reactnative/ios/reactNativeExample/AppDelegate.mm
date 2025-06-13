#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import "RCTWechatAuthModule.h"

// config
NSString* const WechatAppID = @"wxe64ed6a7605b5021";
NSString* const WechatUniversalLink = @"https://authgear-demo-rn.pandawork.com/wechat/";

// Error domain
NSString* const WechatAuthErrorDomain = @"com.authgear.example.reactnative.wechatauth_error";

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"reactNativeExample";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // Setup Wechat SDK
  [WXApi registerApp:WechatAppID universalLink:WechatUniversalLink];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray *))restorationHandler {
  [WXApi handleOpenUniversalLink:userActivity delegate:self];
  return YES;
}

-(void) onReq:(BaseReq*)req
{
}

-(void) onResp:(BaseResp*)resp
{
  SendAuthResp *sendAuthResp;
  if([resp isKindOfClass:[SendAuthResp class]])
  {
    sendAuthResp = (SendAuthResp*)resp;
    NSDictionary<NSString *, id> *payload;
    if (sendAuthResp.errCode == WXSuccess) {
      payload = @{
        @"code": sendAuthResp.code,
        @"state": sendAuthResp.state,
      };
    } else {
      NSString *message;
      switch (resp.errCode) {
        case WXErrCodeUserCancel:
          message = @"errcode_cancel";
          break;
        case WXErrCodeAuthDeny:
          message = @"errcode_deny";
          break;
        case WXErrCodeUnsupport:
          message = @"errcode_unsupported";
          break;
        default:
          message = @"errcode_unknown";
          break;
      }
      payload = @{
        @"error": [NSError errorWithDomain:WechatAuthErrorDomain code:resp.errCode userInfo:nil],
        @"error_message": message,
      };
    }
    [[NSNotificationCenter defaultCenter] postNotificationName:kWechatAuthResultNotification
                                                        object:nil
                                                      userInfo:payload];
  }
}

@end
