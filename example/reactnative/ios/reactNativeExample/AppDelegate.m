#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <AGAuthgearReactNative.h>
#import "RCTWechatAuthModule.h"

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>

static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

// config
NSString* const WechatAppID = @"wxe64ed6a7605b5021";
NSString* const WechatUniversalLink = @"https://authgear-demo-rn.pandawork.com/wechat/";

// Error domain
NSString* const WechatAuthErrorDomain = @"com.authgear.example.reactnative.wechatauth_error";

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"reactNativeExample"
                                            initialProperties:nil];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  // Setup Wechat SDK
  [WXApi registerApp:WechatAppID universalLink:WechatUniversalLink];

  return YES;
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray *))restorationHandler {
  [WXApi handleOpenUniversalLink:userActivity delegate:self];
  [AGAuthgearReactNative application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  RCTBundleURLProvider *settings = [RCTBundleURLProvider sharedSettings];
  // Replace localhost with local IP address for physical devices
  settings.jsLocation = @"localhost:8082";
  return [settings jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
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
