#!/usr/bin/python
# This script was written by Shantu Tiwari and modified by AHRevolvers.
# Shantu's repo: https://github.com/shantnu/PyEng

import sys
import csv
import cv2
import numpy as np
import time

#grab homne directory and then documents
#specified data dumped into here
from pathlib import Path
DEST = str(Path.home()) + "\\Documents\\rgb.txt"

if len(sys.argv) < 2:
    video_capture = cv2.VideoCapture(0)
else:
    filepath = sys.argv[1]
    video_capture = cv2.VideoCapture(filepath)

# Read two frames, last and current, and convert current to gray.
ret, last_frame = video_capture.read()
ret, current_frame = video_capture.read()
gray = cv2.cvtColor(current_frame, cv2.COLOR_BGR2GRAY) #may want to remove this

min = 0
sec = 0
frame = -1

startTime = []
endTime = []

#read rgb.txt and take out anything from it
with open(DEST, "r") as file:
    #csv reader makes each line a list of strings + strips line of extra whitespaces/line returns
    csv_reader = csv.reader(file)
    i = 0
    for line in csv_reader: 
        if i == 0 and len(line) == 3: #only read first line
            i += 1
            print(line)
            startTokens = line[0].split(":") #[hours, minutes, seconds, frames]
            startTime = [int(startTokens[1]), int(startTokens[2]), int(startTokens[3])]
            endTokens = line[1].split(":") #[hours, minutes, seconds, frames]
            endTime = [int(endTokens[1]), int(endTokens[2]), int(endTokens[3])]
        else:
            break
    
if(endTime == []): #couldnt read file
    startTime = [0, 0, 0]
    endTime = [0, 0, 0]


#clear rgb.txt for writing
with open(DEST, "w") as file:
    file.write("")

while True:
    last_frame = current_frame
    ret, current_frame = video_capture.read()

    if not ret:
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
        
    if(currentTime >= startTime and currentTime <= endTime): 
        #image processing
        gray = cv2.cvtColor(current_frame, cv2.COLOR_BGR2GRAY) #may want to remove this
        diff = cv2.absdiff(last_frame, current_frame)
            
        #write if last frame is different enough from current frame
        if np.mean(diff) > 0.7 and frame != -1:
            print("Motion of: " + str(round(np.mean(diff), 2)) + " detected at frame " + smin + ":" + ssec + ":" + sframe)
            with open(DEST, "a") as file:
                file.write(str(round(np.mean(diff), 2)) + "," + currentTime + "\n")

    #uncomment to show difference matte
    #cv2.imshow("Motion detected", diff)
    #time.sleep(0.1)
    
    #frame/sec/min counter
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