const { withPodfile, createRunOncePlugin } = require('@expo/config-plugins');

const FIX_COMMENT = '# Fix fmt compilation with Xcode 16+ (consteval errors)';

const FIX_CODE = `
  ${FIX_COMMENT}
  installer.pods_project.targets.each do |target|
    if target.name == 'fmt'
      target.build_configurations.each do |config|
        next unless config.base_configuration_reference
        path = config.base_configuration_reference.real_path
        next unless path && File.exist?(path)
        lines = File.readlines(path)
        lines.map! do |line|
          if line.start_with?('CLANG_CXX_LANGUAGE_STANDARD')
            "CLANG_CXX_LANGUAGE_STANDARD = c++17\\n"
          else
            line
          end
        end
        File.write(path, lines.join)
      end
      # Patch fmt/base.h directly to disable consteval
      base_h = File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'base.h')
      if File.exist?(base_h)
        content = File.read(base_h)
        unless content.include?('FMT_CONSTEVAL  // disabled by plugin')
          content.gsub!(
            '#  define FMT_CONSTEVAL consteval',
            '#  define FMT_CONSTEVAL  // disabled by plugin'
          )
          File.write(base_h, content)
        end
      end
    end
  end
`;

function withFmtPodfileFix(config) {
  return withPodfile(config, (config) => {
    let contents = config.modResults.contents;

    // Remove existing fix block if present (so updates take effect)
    const fixBlockRegex = new RegExp(
      `\\n[ \\t]*${escapeRegex(FIX_COMMENT)}[\\s\\S]*?(?=\\n[ \\t]*react_native_post_install\\s*\\()`,
      '',
    );
    contents = contents.replace(fixBlockRegex, '');

    // Check if fix is already applied in current form
    if (contents.includes(FIX_CODE.trim())) {
      return config;
    }

    const modified = contents.replace(
      /(react_native_post_install\s*\()/,
      `${FIX_CODE}\n\n$1`,
    );

    config.modResults.contents = modified;
    return config;
  });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = createRunOncePlugin(
  withFmtPodfileFix,
  'with-fmt-podfile-fix',
  '1.0.0',
);
