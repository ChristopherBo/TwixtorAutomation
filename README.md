# TwixtorAutomation
This script automates the setup of Twixtor in After Effects, particularly the steps outlined in section 4, 3a-3c of this guide: https://lolligerjoj.wordpress.com/2016/10/22/twixtor-on-anime-footage-and-ae-workflow-using-twixtor/
![image](https://user-images.githubusercontent.com/70022209/169633226-6f59b265-9cdb-4757-8eeb-e02ac1650220.png)

## Usage:
1. Download the script and the .exe from the [releases](https://github.com/ChristopherBo/TwixtorAutomation/releases) page.
2. Place them in a folder together. This folder cannot be a subfolder of Program Files.
3. Run the script with a project file open via File > Scripts > Run Scripts... (in the top left)
4. Enjoy!

Quick Tip: You can re-run your most recent script using Ctrl + Alt + Shift + D!

To run the script in (limited and buggy but soon to be fixed) docked mode:
1. Download the script from the [releases](https://github.com/ChristopherBo/TwixtorAutomation/releases) page.
2. Place it in C:\Program Files\Adobe\Adobe After Effects 2021\Support Files\Scripts\ScriptUI Panels\.
3. Restart After Effects if it was open
4. Pop open the window using Window > ahr_autoTwixtor.jsx.

## Limitations:
 - 3b has not been implemented.
 - Scene Detection has not been implemented. When it is, it will probably be limited to AE 2022.3 or later due to ExtendScript versions and changes.
 - The FPS detection that makes this work so well is only available to Windows users.
 - The FPS detection system can only be used when the script and the accompanying .exe file are placed in a folder **not** in Program Files.
     - The script is dockable but the FPS detection system will not work for this reason.
 - This script is missing some features and options I hope to include, such as:
     - A default framerate option for 3a to avoid having to detect FPS
     - A threshold changer for the FPS detector
     - A progress bar
     - Being fully functional while docked
     - Persistent settings across uses

## Breakdown:
tl;dr The article referenced at the top of this page outlines 3 strategies:
 - 3a: If constant FPS, precomp, add Twixtor in the precomp and set the FPS to match the framerate
 - 3b: If constant FPS with 1-2 frame changes, precomp, split the clip in the precomp, then repeat 3a to each individual clip
 - 3c: If variable FPS, precomp, time remap in the precomp so that each frame is different, add Twixtor

This script automates the entire process in a couple clicks. To do FPS detection I have put two motion detection systems in place:
 - Python's OpenCV package has a very powerful set of video analysis tools that I use to detect motion in a scene. I have the main script write and execute a Bash script to give the Python script footage and timestamps to analyze by. The Python file then writes the results to a text file in your Documents folder, which the main script has been watching the whole time. Once the main script sees a change in the contents of the file it waits a second to let the Python file finish writing and then sets keyframes on each timestamp placed in the file. The reason we use an exe instead of a Python file is that I packaged the Python file and it's packages into the exe using pyInstaller. You can take a look at the code written in fps_detector.py.
 - ExtendScript has it's own vastly inferior color detection via sampleImage() that allows users to sample a specific area in the current frame. I analyze the entire frame for every frame and get back red, green, and blue values between 0-255 for each. When there is a noticeable change I mark that time and add a time remap point on it after analysis. This method is much slower and innaccurate; However, it can analyze footage even with any effects the user has added to it. Additionally, it serves as a fallback for Mac and Linux users as the in-between Bash script created is Windows-only. If someone reading this knows how to translate the Bash script into something Mac and/or Linux can use, feel free to DM me on discord at AHRevolvers#1984.
