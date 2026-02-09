const {
  withXcodeProject,
  withEntitlementsPlist,
  withInfoPlist,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const WIDGET_NAME = "PerfectCalendarWidgetExtension";
const APP_GROUP = "group.com.perfectcalendar.app";

module.exports = function withIOSWidget(config) {
  // 1. 메인 앱에 App Groups 엔타이틀먼트 추가
  config = withAppGroupEntitlement(config);

  // 2. 메인 앱 Info.plist에 App Group 추가
  config = withInfoPlist(config, (mod) => {
    return mod;
  });

  // 3. Xcode 프로젝트에 위젯 익스텐션 타겟 추가
  config = withWidgetTarget(config);

  return config;
};

function withAppGroupEntitlement(config) {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults["com.apple.security.application-groups"] = [APP_GROUP];
    return mod;
  });
}

function withWidgetTarget(config) {
  return withXcodeProject(config, async (mod) => {
    const xcodeProject = mod.modResults;
    const projectRoot = mod.modRequest.projectRoot;
    const iosPath = mod.modRequest.platformProjectRoot;
    const mainBundleId =
      config.ios?.bundleIdentifier || "com.perfectcalendar.app";
    const widgetBundleId = mainBundleId + ".widget";

    // --- 파일 생성 ---
    const widgetDir = path.join(iosPath, WIDGET_NAME);
    if (!fs.existsSync(widgetDir)) {
      fs.mkdirSync(widgetDir, { recursive: true });
    }

    // Swift 소스 복사
    const swiftSource = path.join(
      projectRoot,
      "ios-widget",
      "PerfectCalendarWidget.swift"
    );
    const swiftDest = path.join(widgetDir, "PerfectCalendarWidget.swift");
    fs.copyFileSync(swiftSource, swiftDest);

    // 위젯 엔타이틀먼트 파일 생성
    const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP}</string>
    </array>
</dict>
</plist>`;
    fs.writeFileSync(
      path.join(widgetDir, `${WIDGET_NAME}.entitlements`),
      entitlementsContent
    );

    // 위젯 Info.plist 생성
    const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>PerfectCalendar Widget</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>$(MARKETING_VERSION)</string>
    <key>CFBundleVersion</key>
    <string>$(CURRENT_PROJECT_VERSION)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.widgetkit-extension</string>
    </dict>
</dict>
</plist>`;
    fs.writeFileSync(path.join(widgetDir, "Info.plist"), infoPlistContent);

    // --- Xcode 프로젝트 수정 ---

    // 위젯 익스텐션 타겟 추가
    const widgetTarget = xcodeProject.addTarget(
      WIDGET_NAME,
      "app_extension",
      WIDGET_NAME,
      widgetBundleId
    );

    // PBXGroup 생성 및 메인 그룹에 추가
    const widgetGroupResult = xcodeProject.addPbxGroup(
      [
        "PerfectCalendarWidget.swift",
        "Info.plist",
        `${WIDGET_NAME}.entitlements`,
      ],
      WIDGET_NAME,
      WIDGET_NAME,
      '"<group>"'
    );

    // 메인 프로젝트 그룹에 위젯 그룹 추가
    const mainProject = xcodeProject.getFirstProject();
    const mainGroupKey = mainProject.firstProject.mainGroup;
    const mainGroup = xcodeProject.getPBXGroupByKey(mainGroupKey);
    if (mainGroup && mainGroup.children) {
      mainGroup.children.push({
        value: widgetGroupResult.uuid,
        comment: WIDGET_NAME,
      });
    }

    // Swift 소스 파일을 위젯 타겟의 Sources 빌드 페이즈에 추가
    xcodeProject.addSourceFile(
      `${WIDGET_NAME}/PerfectCalendarWidget.swift`,
      { target: widgetTarget.uuid },
      widgetGroupResult.uuid
    );

    // 프레임워크 추가
    xcodeProject.addFramework("WidgetKit.framework", {
      target: widgetTarget.uuid,
      link: true,
    });
    xcodeProject.addFramework("SwiftUI.framework", {
      target: widgetTarget.uuid,
      link: true,
    });
    xcodeProject.addFramework("AppIntents.framework", {
      target: widgetTarget.uuid,
      link: true,
    });

    // 위젯 타겟 빌드 설정
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    const nativeTarget =
      xcodeProject.pbxNativeTargetSection()[widgetTarget.uuid];

    if (nativeTarget) {
      const configListKey = nativeTarget.buildConfigurationList;
      const configList = xcodeProject.pbxXCConfigurationList()[configListKey];

      if (configList && configList.buildConfigurations) {
        for (const ref of configList.buildConfigurations) {
          const buildConfig = configurations[ref.value];
          if (buildConfig && buildConfig.buildSettings) {
            Object.assign(buildConfig.buildSettings, {
              SWIFT_VERSION: "5.0",
              TARGETED_DEVICE_FAMILY: '"1,2"',
              CODE_SIGN_ENTITLEMENTS: `"${WIDGET_NAME}/${WIDGET_NAME}.entitlements"`,
              INFOPLIST_FILE: `"${WIDGET_NAME}/Info.plist"`,
              PRODUCT_BUNDLE_IDENTIFIER: `"${widgetBundleId}"`,
              MARKETING_VERSION: "1.0",
              CURRENT_PROJECT_VERSION: "1",
              IPHONEOS_DEPLOYMENT_TARGET: "17.0",
              GENERATE_INFOPLIST_FILE: "NO",
              SWIFT_EMIT_LOC_STRINGS: "YES",
              CODE_SIGN_STYLE: "Automatic",
              CODE_SIGNING_REQUIRED: "YES",
              CODE_SIGNING_ALLOWED: "YES",
              DEVELOPMENT_TEAM: '"L993PK7S6Q"',
              LD_RUNPATH_SEARCH_PATHS:
                '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
              PRODUCT_NAME: `"$(TARGET_NAME)"`,
              SKIP_INSTALL: "YES",
            });
          }
        }
      }
    }

    // 메인 타겟에 위젯 타겟 디펜던시 추가
    const mainAppTarget = xcodeProject.getFirstTarget();
    xcodeProject.addTargetDependency(mainAppTarget.uuid, [widgetTarget.uuid]);

    // Embed App Extensions 빌드 페이즈 추가 (메인 앱에 위젯 포함)
    xcodeProject.addBuildPhase(
      [],
      "PBXCopyFilesBuildPhase",
      "Embed Foundation Extensions",
      mainAppTarget.uuid,
      "app_extension"
    );

    return mod;
  });
}
