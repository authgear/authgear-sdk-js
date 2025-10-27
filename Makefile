REF := $(shell git describe --all --exact-match | sed -e "s|^heads/||")
GIT_HASH ?= git-$(shell git rev-parse --short=12 HEAD)
IMAGE ?= quay.io/theauthgear/authgear-demo-webapp:$(GIT_HASH)

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
		--useHTMLAnchors \
		--entryFileName index.md
	npx typedoc \
		--options typedoc/typedoc.json \
		--tsconfig typedoc/tsconfig.react-native.json \
		--name @authgear/react-native \
		--entryPoints packages/authgear-react-native/index.d.ts \
		--out ./temp/docs/react-native \
		--plugin typedoc-plugin-markdown \
		--useHTMLAnchors \
		--entryFileName index.md
	npx typedoc \
		--options typedoc/typedoc.json \
		--tsconfig typedoc/tsconfig.capacitor.json \
		--name @authgear/capacitor \
		--entryPoints packages/authgear-capacitor/index.d.ts \
		--out ./temp/docs/capacitor \
		--plugin typedoc-plugin-markdown \
		--useHTMLAnchors \
		--entryFileName index.md
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

.PHONY: ruby-audit
ruby-audit:
	bundle exec bundler-audit check --update

.PHONY: clean
clean:
	rm -rf ./build

.PHONY: sdk-build
sdk-build:
	npm ci
	npm run build

.PHONY: react-native-npm-ci
react-native-npm-ci:
	cd ./example/reactnative; \
		rm -rf node_modules; \
		yarn install --frozen-lockfile

.PHONY:	react-native-build-unsigned-aab
react-native-build-unsigned-aab:
	cd ./example/reactnative/android; \
		./gradlew :app:bundleRelease

.PHONY: react-native-pod-install
react-native-pod-install:
	cd ./example/reactnative/ios; bundle exec pod install

.PHONY: react-native-build-ios-app
react-native-build-ios-app:
	bundle exec fastlane ios react_native_build_ios_app CURRENT_PROJECT_VERSION:$(shell date +%s)

.PHONY: react-native-upload-ios-app
react-native-upload-ios-app:
	bundle exec fastlane ios upload_ios_app ipa:./build/Release/iOS/reactNativeExample/reactNativeExample.ipa

.PHONY: react-native-build-aab
react-native-build-aab:
	bundle exec fastlane android react_native_build_aab \
		VERSION_CODE:$(shell date +%s) \
		STORE_FILE:$(STORE_FILE) \
		STORE_PASSWORD:$(STORE_PASSWORD) \
		KEY_ALIAS:$(KEY_ALIAS) \
		KEY_PASSWORD:$(KEY_PASSWORD)

.PHONY: react-native-upload-aab
react-native-upload-aab:
	bundle exec fastlane android react_native_upload_aab \
		json_key:$(GOOGLE_SERVICE_ACCOUNT_KEY_JSON_FILE)

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
	bundle exec fastlane ios capacitor_build_ios_simulator

.PHONY: capacitor-build-ios-app
capacitor-build-ios-app:
	bundle exec fastlane ios capacitor_build_ios_app CURRENT_PROJECT_VERSION:$(shell date +%s)

.PHONY: capacitor-upload-ios-app
capacitor-upload-ios-app:
	bundle exec fastlane ios upload_ios_app ipa:./build/Release/iOS/capacitor/capacitor.ipa

.PHONY: capacitor-build-unsigned-aab
capacitor-build-unsigned-aab:
	cd ./example/capacitor/android; \
		./gradlew :app:bundleRelease

.PHONY: capacitor-build-aab
capacitor-build-aab:
	bundle exec fastlane android capacitor_build_aab \
		VERSION_CODE:$(shell date +%s) \
		STORE_FILE:$(STORE_FILE) \
		STORE_PASSWORD:$(STORE_PASSWORD) \
		KEY_ALIAS:$(KEY_ALIAS) \
		KEY_PASSWORD:$(KEY_PASSWORD)

.PHONY: capacitor-upload-aab
capacitor-upload-aab:
	bundle exec fastlane android capacitor_upload_aab \
		json_key:$(GOOGLE_SERVICE_ACCOUNT_KEY_JSON_FILE)
