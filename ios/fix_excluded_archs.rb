#!/usr/bin/env ruby
require "xcodeproj"
project_path = "AiSocialApp.xcodeproj"
project = Xcodeproj::Project.open(project_path)
project.targets.each do |target|
  target.build_configurations.each do |config|
    config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = "arm64"
    config.build_settings["ENABLE_USER_SCRIPT_SANDBOXING"] = "NO"
  end
end
project.save
puts "Successfully updated excluded architectures in #{project_path}"
