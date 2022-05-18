#!/usr/bin/python
# This script was written by Shantu Tiwari and modified by AHRevolvers.
# Shantu's repo: https://github.com/shantnu/PyEng

import sys
import csv
import cv2
import numpy as np
import time
import math

#grab home directory and then documents
#specified data dumped into here
from pathlib import Path
DEST = str(Path.home()) + "\\Documents\\rgb.txt"

if len(sys.argv) < 2:
    video_capture = cv2.VideoCapture(0)
else:
    filepath = sys.argv[1]
    video_capture = cv2.VideoCapture(filepath)

# Read two frames, last and current
ret, last_frame = video_capture.read()
ret, current_frame = video_capture.read()

min = 0
sec = 0
frame = -1
frametotal = -1
clipfps = video_capture.get(cv2.CAP_PROP_FPS)

startTime = 0
endTime = 0

#make sure rgb.txt exists first- if not leave
try:
    with open(DEST, "r") as file:
        i=0
except FileNotFoundError:
    print("ERROR: rgb.txt was not created! Quitting...")
    video_capture.release()
    cv2.destroyAllWindows()
    exit()



#read rgb.txt and take out anything from it
with open(DEST, "r") as file:
    #csv reader makes each line a list of strings + strips line of extra whitespaces/line returns
    csv_reader = csv.reader(file)
    i = 0
    for line in csv_reader: 
        if i == 0 and len(line) == 2: #only read first line
            i += 1
            print(line)
            #convert start and end times to frame numbers from seconds
            startRawTime = float(line[0])
            startTime = int(startRawTime*clipfps)
            endRawTime = float(line[1])
            endTime = int(endRawTime*clipfps) - startTime
            print("Start time: " + str(startTime) + "\t End time: " + str(endTime))
            video_capture.set(1, startTime-1)
        else:
            break


#clear rgb.txt for writing
with open(DEST, "w") as file:
    file.write("")

while True:
    last_frame = current_frame
    ret, current_frame = video_capture.read()

    if not ret or frametotal > endTime:
        print("Frametotal of " + str(frametotal) + " exceeds endTime of " + str(endTime) + ". Quitting...")
        break
    
    #string conversions- if frame/sec/min 9 or less add a prefix 0 for consistency
    sframe = str(frame)
    if frame < 10:
        sframe = "0" + str(frame)
    
    ssec = str(sec)
    if sec < 10:
        ssec = "0" + str(sec)
        
    smin = str(min)
    if min < 10:
        smin = "0" + str(min)
        
    currentTime = smin + ":" + ssec + ":" + sframe
      
    if(frametotal <= endTime): 
        diff = cv2.absdiff(last_frame, current_frame) #image processing  

        #write if last frame is different enough from current frame
        if np.mean(diff) > 0.7 and frame != -1:
            print("Motion of: " + str(round(np.mean(diff), 2)) + " detected at frame " + smin + ":" + ssec + ":" + sframe + "\t total frame " + str(round(video_capture.get(1), 0)))
            with open(DEST, "a") as file:
                file.write(str(round(np.mean(diff), 2)) + "," + currentTime + "\n")
                
    # if np.mean(diff) > 0.7 and frame != -1:
    #     print("Gatekept motion of " + str(round(np.mean(diff), 2)) + ". Min: " + str(startTime) + "<=" + str(frametotal) + "<=" + str(endTime))

    #uncomment to show difference matte
    #cv2.imshow("Motion detected", diff)
    #time.sleep(0.1)
    
    #frame/sec/min counter
    frametotal += 1
    #print("Frame number " + str(round(video_capture.get(1), 2)))
    frame += 1
    if frame == 24:
        sec += 1
        frame = 0
    if sec == 60:
        min += 1
        sec = 0

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break


video_capture.release()
cv2.destroyAllWindows()