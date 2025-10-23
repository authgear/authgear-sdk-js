#import <UIKit/UIKit.h>
#import <WXApi.h>
#import <RCTReactNativeFactory.h>
#import <RCTDefaultReactNativeFactoryDelegate.h>

@interface ReactNativeDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@interface AppDelegate : UIResponder <UIApplicationDelegate, WXApiDelegate>

@property (nonatomic, strong, nonnull) UIWindow *window;
@property (nonatomic, strong, nonnull) RCTReactNativeFactory *reactNativeFactory;
@property (nonatomic, strong, nonnull) ReactNativeDelegate *reactNativeDelegate;

@end
