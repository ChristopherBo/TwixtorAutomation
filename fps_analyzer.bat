@echo off
echo ///////////////////////////////
echo Installing required packages...
echo ///////////////////////////////
pip install scipy
pip install numpy
pip install pywavelets
pip install matplotlib
echo ///////////////////////////////
echo Detecting fps...
echo ///////////////////////////////
python "G:\Recording Footage\Tutorials\TwixtorAutomation\fps_detector.py" "G:\Recording Footage\Tutorials\TwixtorAutomation\Violet Evergarden, Episode 1.mp4"
echo Finished! This program will close in 5 seconds. You can also close it with Ctrl + C.
timeout 6
undefined