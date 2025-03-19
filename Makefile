REF := $(shell git describe --all --exact-match | sed -e "s|^heads/||")
GIT_HASH ?= git-$(shell git rev-parse --short=12 HEAD)
IMAGE ?= quay.io/theauthgear/authgear-demo-webapp:$(GIT_HASH)

API_ISSUER ?= invalid
API_KEY ?= invalid

REACT_NATIVE_ARCHIVE_PATH ?= ./build/Release/iOS/reactNativeExample.xcarchive
REACT_NATIVE_EXPORT_PATH ?= ./build/Release/iOS/reactNativeExample.export

CAPACITOR_ARCHIVE_PATH ?= ./build/Release/iOS/App/App.xcarchive
CAPACITOR_EXPORT_PATH ?= ./build/Release/iOS/App/App.export

# The documentation build pipeline works in the following way.
#
# 1. Generate individual .d.ts with tsc.
# 2. Generate rollup .d.ts with api-extractor.
# 3. Generate markdown files with typedoc and typedoc-plugin-markdown
# 4. Rewrite document ID.
# 5. Generate sidebars.js
.PHONY: docs
docs:
	rm -rf ./temp/
	mkdir -p ./temp/docs
	npm run dts
	npx typedoc \
		--options typedoc/typedoc.json \
		--tsconfig typedoc/tsconfig.web.json \
		--name @authgear/web \
		--entryPoints packages/authgear-web/index.d.ts \
		--out ./temp/docs/web \
		--plugin typedoc-plugin-markdown \
		--namedAnchors \
		--entryDocument index.md
	npx typedoc \
		--options typedoc/typedoc.json \
		--tsconfig typedoc/tsconfig.react-native.json \
		--name @authgear/react-native \
		--entryPoints packages/authgear-react-native/index.d.ts \
		--out ./temp/docs/react-native \
		--plugin typedoc-plugin-markdown \
		--namedAnchors \
		--entryDocument index.md
	npx typedoc \
		--options typedoc/typedoc.json \
		--tsconfig typedoc/tsconfig.capacitor.json \
		--name @authgear/capacitor \
		--entryPoints packages/authgear-capacitor/index.d.ts \
		--out ./temp/docs/capacitor \
		--plugin typedoc-plugin-markdown \
		--namedAnchors \
		--entryDocument index.md
	cp ./typedoc/index.md ./temp/docs/index.md
	cp ./typedoc/web_index.md ./temp/docs/web/index.md
	cp ./typedoc/react_native_index.md ./temp/docs/react-native/index.md
	cp ./typedoc/capacitor_index.md ./temp/docs/capacitor/index.md
	node ./scripts/generate_sidebars_js.js ./temp/docs >./temp/sidebars.js
	rm -rf ./website/docs
	cp -R ./temp/docs/. ./website/docs
	cp ./temp/sidebars.js ./website
	(cd website && npm run build)

.PHONY: deploy-docs
deploy-docs: docs
	./scripts/deploy_docs.sh

# NOTE(louis): For some unknown reason, if platfrom is set to linux/x86_64,
# The npm run build will get stuck forever on my Apple Silicon MacBook.
# So we have to build it on CI.
.PHONY: build-image
build-image:
	docker build --tag $(IMAGE) --file ./example/reactweb/Dockerfile .

.PHONY: push-image
push-image:
	docker push $(IMAGE)

.PHONY: clean
clean:
	rm -rf ./example/reactnative/ios/build
	rm -rf ./example/capacitor/ios/App/App/build

.PHONY: sdk-build
sdk-build:
	npm ci
	npm run build

.PHONY: react-native-npm-ci
react-native-npm-ci:
	cd ./example/reactnative; \
		rm -rf node_modules; \
		yarn install --frozen-lockfile

.PHONY: react-native-set-versionCode
react-native-set-versionCode:
	/usr/bin/sed -I "" "s/versionCode 1/versionCode $(shell date +%s)/" ./example/reactnative/android/app/build.gradle

.PHONY:	react-native-build-unsigned-apk
react-native-build-unsigned-apk:
	cd ./example/reactnative/android; \
		./gradlew :app:assembleRelease

.PHONY: react-native-zipalign
react-native-zipalign:
	"$(ANDROID_HOME)/build-tools/33.0.3/zipalign" -c -v 4 ./example/reactnative/android/app/build/outputs/apk/release/app-release-unsigned.apk

.PHONY: react-native-apksigner
react-native-apksigner:
	"$(ANDROID_HOME)/build-tools/33.0.3/apksigner" sign \
		--ks $(ANDROID_KEYSTORE_PATH) \
		--ks-key-alias $(ANDROID_KEY_ALIAS) \
		--ks-pass pass:$(ANDROID_KEYSTORE_PASSWORD) \
		--key-pass pass:$(ANDROID_KEY_PASSWORD) \
		--out ./example/reactnative/android/app/build/outputs/apk/release/app-release-signed.apk \
		./example/reactnative/android/app/build/outputs/apk/release/app-release-unsigned.apk

.PHONY: react-native-bundle-install
react-native-bundle-install:
	cd ./example/reactnative; bundle install

.PHONY: react-native-pod-install
react-native-pod-install:
	cd ./example/reactnative/ios; bundle exec pod install

.PHONY: react-native-set-CFBundleVersion
react-native-set-CFBundleVersion:
	/usr/libexec/Plistbuddy -c "Set CFBundleVersion $(shell date +%s)" ./example/reactnative/ios/reactNativeExample/Info.plist

.PHONY: react-native-archive
react-native-archive:
	cd ./example/reactnative/ios; \
		xcodebuild archive \
			-destination "generic/platform=iOS" \
			-workspace reactNativeExample.xcworkspace \
			-scheme reactNativeExample \
			-configuration Release \
			-archivePath $(REACT_NATIVE_ARCHIVE_PATH)

.PHONY: react-native-export-archive
react-native-export-archive:
	cd ./example/reactnative/ios; \
		xcodebuild -exportArchive \
			-archivePath $(REACT_NATIVE_ARCHIVE_PATH) \
			-exportPath $(REACT_NATIVE_EXPORT_PATH) \
			-exportOptionsPlist ./ExportOptions.plist

.PHONY: capacitor-npm-ci
capacitor-npm-ci:
	cd ./example/capacitor; \
		npm ci

.PHONY: capacitor-npm-audit
capacitor-npm-audit:
	cd ./example/capacitor; \
		npm audit

# npx cap sync runs `bundle exec pod install` under the hood.
.PHONY: capacitor-build-js
capacitor-build-js:
	cd ./example/capacitor; \
		npm run build; \
		npx cap sync

.PHONY: capacitor-build-ios-simulator
capacitor-build-ios-simulator:
	cd ./example/capacitor/ios/App; \
		xcodebuild build \
			-destination "generic/platform=iOS Simulator" \
			-workspace App.xcworkspace \
			-scheme App

.PHONY: capacitor-set-CFBundleVersion
capacitor-set-CFBundleVersion:
	/usr/libexec/Plistbuddy -c "Set CFBundleVersion $(shell date +%s)" ./example/capacitor/ios/App/App/Info.plist

.PHONY: capacitor-archive
capacitor-archive:
	cd ./example/capacitor/ios/App; \
		xcodebuild archive \
			-destination "generic/platform=iOS" \
			-workspace App.xcworkspace \
			-scheme App \
			-configuration Release \
			-archivePath $(CAPACITOR_ARCHIVE_PATH)

.PHONY: capacitor-exportArchive
capacitor-exportArchive:
	cd ./example/capacitor/ios/App; \
		xcodebuild -exportArchive \
			-archivePath $(CAPACITOR_ARCHIVE_PATH) \
			-exportPath $(CAPACITOR_EXPORT_PATH) \
			-exportOptionsPlist ./ExportOptions.plist

.PHONY: capacitor-build-unsigned-apk
capacitor-build-unsigned-apk:
	cd ./example/capacitor/android; \
		./gradlew :app:assembleRelease

.PHONY: capacitor-set-versionCode
capacitor-set-versionCode:
	/usr/bin/sed -I "" "s/versionCode 1/versionCode $(shell date +%s)/" ./example/capacitor/android/app/build.gradle

.PHONY: capacitor-zipalign
capacitor-zipalign:
	"$(ANDROID_HOME)/build-tools/35.0.1/zipalign" -c -v 4 ./example/capacitor/android/app/build/outputs/apk/release/app-release-unsigned.apk

.PHONY: capacitor-apksigner
capacitor-apksigner:
	"$(ANDROID_HOME)/build-tools/35.0.1/apksigner" sign \
		--ks $(ANDROID_KEYSTORE_PATH) \
		--ks-key-alias $(ANDROID_KEY_ALIAS) \
		--ks-pass pass:$(ANDROID_KEYSTORE_PASSWORD) \
		--key-pass pass:$(ANDROID_KEY_PASSWORD) \
		--out ./example/capacitor/android/app/build/outputs/apk/release/app-release-signed.apk \
		./example/capacitor/android/app/build/outputs/apk/release/app-release-unsigned.apk

.PHONY:	validate-app
validate-app:
	xcrun altool --validate-app \
		--file $(IPA_PATH) \
		--type ios \
		--apiKey $(API_KEY) \
		--apiIssuer $(API_ISSUER)

.PHONY: upload-app
upload-app:
	xcrun altool --upload-app \
		--file $(IPA_PATH) \
		--type ios \
		--apiKey $(API_KEY) \
		--apiIssuer $(API_ISSUER)
