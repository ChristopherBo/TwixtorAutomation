//ahr_autoTwixtor.jsx Version 0.6
// Copyright (c) 2022 AHRevolvers. All rights reserved.
//
// This script will automatically setup twixtor for a user based on this article,
// section 4, steps 3a-3c: https://lolligerjoj.wordpress.com/2016/10/22/twixtor-on-anime-footage-and-ae-workflow-using-twixtor/
// Find more of these scripts on my channel https://www.youtube.com/c/AHRevolvers
//
//Changelog:
// - figure out how to get a layer's source path
// - figure out scene detection using python
// - exec the python file via bash script
// - screw around with the extendscript detection system
// - added a gui
// - check if user has twixtor installed
// - take in files
// - rudimentary fps checker implemented
// - undo works in 1 button for entire script actions instead of 1 by 1
// - make precomp duration same as clip duration
// - 3c works
//
//Todo:
// - progress bar
// - make it dockable
// - add an advanced options window connected to a preferences.txt file
//      - make it not close on use
//      - changeable default fps from 23.976 to whatever user wants
// - install dependencies once in a different bash script for faster analysis
//
//Legal stuff:
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// This script is provided "as is," without warranty of any kind, expressed
// or implied. In no event shall the author be held liable for any damages
// arising in any way from the use of this script.
//


//GLOBALS/PREFERENCES
(function ahr_autoTwixtor(thisObj) {

    var ahr_autoTwixtor = new Object();	// Store globals in an object
	ahr_autoTwixtor.scriptName = "ahr_autoTwixtor";
	ahr_autoTwixtor.scriptTitle = ahr_autoTwixtor.scriptName + "v0.6";
	
	// Check that a project exists
	if (app.project === null) {
        alert("Project does not exist!");
		return false;
    }

    // Check that an active comp exists
	if (app.project.activeItem === null) {
        alert("There is no active comp!");
		return false;
    }

    function checkForInstalledEffect(){
        var effects = app.effects;
        for (var i = 0; i < effects.length; i++){
            if (effects[i].displayName == "Twixtor Pro") {
                return true;
            }
        }
        return false;
    }
    if(checkForInstalledEffect() == false) {
        alert("Twixtor is not installed!");
        return false;
    }
    
    //////////////////////////////////////////
    //MAIN UI
    //////////////////////////////////////////
    scriptBuildUI(thisObj)
    function scriptBuildUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window('palette', "AHRevolver's Auto Twixtor Script v0.6", undefined, {
            resizeable: true
        });
        win.spacing = 0;
        // var mainWindow = new Window("palette", "AHRevolver's Auto Twixtor Script v0.6", undefined);
        win.orientation = "column";

        var mainGroup = win.add("group", undefined, "mainGroup");
        mainGroup.orientation = "column";

        //help window
        var helpWindow = new Window("dialog", "What is this thing?", undefined);
        var helpText = helpWindow.add("group"); 
        helpText.preferredSize.width = 500; 
        helpText.orientation = "column"; 
        helpText.alignChildren = ["left","center"]; 
        helpText.spacing = 0; 

        helpText.add("statictext", undefined, "This script was written in guidance with lolligerjoj's twixtor article, which you", {name: "helpText"}); 
        helpText.add("statictext", undefined, "can find here:https://lolligerjoj.wordpress.com/2016/10/22/twixtor-on-anime-", {name: "helpText"}); 
        helpText.add("statictext", undefined, "footage-and-ae-workflow-using-twixtor/ ", {name: "helpText"}); 
        helpText.add("statictext", undefined, "", {name: "helpText"}); 
        helpText.add("statictext", undefined, "In and Out Layers determine what range of layers to apply to. Selecting the", {name: "helpText"}); 
        helpText.add("statictext", undefined, "same in and out layer only selects 1 layer, while selecting layers 6 and 10 for in", {name: "helpText"}); 
        helpText.add("statictext", undefined, "and out selects layers 6, 7, 8, 9, and 10. It does not matter what order you select", {name: "helpText"}); 
        helpText.add("statictext", undefined, "them in. ", {name: "helpText"}); 
        helpText.add("statictext", undefined, "", {name: "helpText"}); 
        helpText.add("statictext", undefined, "3a, 3b, and 3c represent different methods to interpolate using Twixtor:", {name: "helpText"}); 
        helpText.add("statictext", undefined, " - 3a: Constant framerate, linear interpolation.", {name: "helpText"}); 
        helpText.add("statictext", undefined, " - 3b: Split the clip where the framerate changes and treat each part like 3a.", {name: "helpText"}); 
        helpText.add("statictext", undefined, " - 3c: Precomp the clip, add time remapping, and force every frame to be a new", {name: "helpText"}); 
        helpText.add("statictext", undefined, "frame. ", {name: "helpText"}); 
        helpText.add("statictext", undefined, "", {name: "helpText"}); 
        helpText.add("statictext", undefined, "Option 3b, 3c, and Scene Detection all use an external Python file to deal with", {name: "helpText"}); 
        helpText.add("statictext", undefined, "image detection and are still experimental. ", {name: "helpText"}); 
        helpText.add("statictext", undefined, "", {name: "helpText"}); 
        helpText.preferredSize.width = 400;

        var helpButton = mainGroup.add("button", undefined, "?");
        helpButton.onClick = function() {
            helpWindow.center();
            helpWindow.show();
        }

        var groupOne = mainGroup.add("group");
        groupOne.orientation = "column";

        //layer range- from layer x to layer y
        //start and end layer can be the same to select 1 layer
        var layerPanel = groupOne.add("panel", undefined, "Choose the layer(s) to detect audio from.");
        var inGroup = layerPanel.add("group", undefined, "inGroup");
        inGroup.orientation = "row";
        var inText = inGroup.add("statictext", undefined, "In Layer:");
        var inLayer = inGroup.add("dropdownlist", undefined, getAllCompLayerNames(app.project.activeItem));
        inLayer.size = [250, 25];
        inLayer.selection = 0;

        //out layer selection
        var outGroup = layerPanel.add("group", undefined, "outGroup");
        outGroup.orientation = "row";
        var outText = outGroup.add("statictext", undefined, "Out Layer:");
        var outLayer = outGroup.add("dropdownlist", undefined, getAllCompLayerNames(app.project.activeItem));
        outLayer.size = [250, 25];
        outLayer.selection = 0;

        //framerate options
        var groupOptions = mainGroup.add("group", undefined, "groupOptions");
        groupOptions.orientation = "column";
        var groupPanel = groupOptions.add("panel", undefined, "Twixtor Settings");
        // archived manual fps input, radio buttons dont work with cleaner design of it 
        // var inputFPSGroup = groupPanel.add("group", undefined, "inputFPSGroup");
        // inputFPSGroup.orientation = "row";
        // var inputFPS = inputFPSGroup.add("edittext", undefined, "");
        // inputFPS.preferredSize.width = 45;
        // inputFPS.preferredSize.height = 17;
        var constantFPS = groupPanel.add("radiobutton", undefined, "Constant Framerate (3a):");
        constantFPS.value = true;
        var cutFPS = groupPanel.add("radiobutton", undefined, "Framerate occasionally changes (3b)");
        cutFPS.value = false;
        var variableFPS = groupPanel.add("radiobutton", undefined, "Framerate changes often (3c)");
        variableFPS.value = false;
        var detectFPS = groupPanel.add("checkbox", undefined, "Detect framerate(s) of clips (experimental)");
        detectFPS.value = true;
        var threeBText = groupPanel.add("statictext", undefined, "Note: 3b will auto-detect framerate.");

        //experimental features and misc buttons
        var autoCut = groupOptions.add("checkbox", undefined, "Scene Detection (multiple shots in each layer)");
        autoCut.value = false;
        var debug = groupOptions.add("checkbox", undefined, "Debug Program");
        debug.value = false;
        var setupButton = win.add("button", undefined, "Go!");


        // mainWindow.center();
        // mainWindow.show();

        setupButton.onClick = function() {
            //win.close();
            if(debug.value) { writeToDebugFile("Starting...\n"); }
            //alert("gogogo");

            app.beginUndoGroup("Auto Twixtor Script");

            //grab each layer and put them in a list
            var layers = [];
            var comp = app.project.activeItem;
            var firstLayer = findLayerFromName(comp, inLayer.selection);
            var lastLayer = findLayerFromName(comp, outLayer.selection);

            //if firstlayer's index is larger than lastlayer's swap what they are
            if(firstLayer.index > lastLayer.index) {
                if(debug.value) { writeToDebugFile("Swapping first and last layer\n") }
                firstLayer, lastLayer = lastLayer, firstLayer;
            }

            //base case just add the 1 layer
            if(firstLayer.index == lastLayer.index) {
                layers = [firstLayer];
            } else {
                //iterate through indexes and add list items
                for(var i=firstLayer.index; i <= lastLayer.index; i++) {
                    layers.push(comp.layer(i));
                }
            }

            //if there is scene detection, detect and cut
            if(autoCut.value == true) {
                //scene detection stuff here
                //probably python?
            }

            //precomp range of layers
            var twixFolder = app.project.items.addFolder("Twixtor Precomps");
            for(var i=0; i < layers.length; i++) {
                if(debug.value) { writeToDebugFile("Setting up " + layers[i].name + "\n"); }
                var layerIndex = layers[i].index;
                var precomp = comp.layers.precompose([layers[i].index], "twix_"+ layers[i].name, false);
                var precompLayer = comp.layers[layerIndex];
                //precomp fits the same area and same duration as original
                // precomp.displayStartTime = precompLayer.inPoint - precompLayer.startTime;
                //the next 5 lines are mythical and are not to be changed under any circumstances
                precomp.duration = precompLayer.outPoint - precompLayer.startTime;
                precomp.layers[1].outPoint = precompLayer.outPoint - precompLayer.startTime;
                precomp.layers[1].inPoint = precompLayer.inPoint - precompLayer.startTime;
                precomp.layers[1].startTime = -precompLayer.inPoint + precompLayer.startTime;
                precomp.duration = precompLayer.outPoint - precompLayer.inPoint;
                precomp.parentFolder = twixFolder;

                //enable time remapping on each clip
                precompLayer.timeRemapEnabled = true;

                //add points to in and out
                //setValueAtTime(old time, new time);
                precompLayer.timeRemap.setValueAtTime(precompLayer.inPoint, precompLayer.inPoint - precompLayer.inPoint);
                precompLayer.timeRemap.setValueAtTime(precompLayer.outPoint - (1/comp.frameRate), (precompLayer.outPoint - precompLayer.inPoint) - (1/comp.frameRate));

                //remove first and last time remap points
                //precompLayer.timeRemap.removeKey(precompLayer.timeRemap.nearestKeyIndex(0));
                precompLayer.timeRemap.removeKey(precompLayer.timeRemap.nearestKeyIndex(precomp.duration + precompLayer.startTime));
                if(debug.value) { writeToDebugFile("Finished setting up " + layers[i].name + "\n"); }
            }

            //iterate through all precomps and decide what to do
            for(var i=1; i <= twixFolder.numItems; i++) {
                precomp = twixFolder.item(i);
                if(debug.value) { writeToDebugFile("Twixtoring precomp " + precomp.name + "...\n"); }
                //slice cuts off the first 5 letters- the twix_ part
                precompLayer = matchNameToLayer(precomp.name.slice(5), comp);
                if(constantFPS.value == true) { //3a
                    if(debug.value) { writeToDebugFile("Twix method 3a chosen.\n"); }
                    twixConstant(precomp, 0);
                } else if(cutFPS.value == true) { //3b
                    if(debug.value) { writeToDebugFile("Twix method 3b chosen.\n"); }
                    //need to do this sometime
                } else if(variableFPS.value == true) { //3c
                    if(debug.value) { writeToDebugFile("Twix method 3c chosen.\n"); }
                    var keyframes = twixVariable(precomp);
                    //todo: change comp duration and time remap keyframes accordingly
                    precomp.duration = (keyframes - 1)/precomp.frameRate;
                    precompLayer.timeRemap.setValueAtTime(precompLayer.inPoint + (keyframes/comp.frameRate), (keyframes - 1)/precomp.frameRate);
                    precompLayer.timeRemap.removeKey(precompLayer.timeRemap.nearestKeyIndex(precompLayer.outPoint));
                    precompLayer.outPoint = precompLayer.inPoint + ((keyframes + 1)/comp.frameRate);
                } else if(detectFPS.value == true) { //autodetect one of the top choices

                }
                if(debug.value) { writeToDebugFile("Finished twixtoring precomp " + precomp.name + "\n"); }
            }
            
            if(debug.value) { writeToDebugFile("autoTwixtor complete.\n"); }
            app.endUndoGroup();
        }

        //applies twixtor on a clip
        function twixConstant(precomp, fps) {
            if(debug.value) { writeToDebugFile("twixConstant: starting...\n"); }
            //0 fps == default from GUI
            //if gui is nothing set to layer 1's fps
            //if layer 1 doesnt have fps set it to 23.976
            // if(fps == 0) { fps = inputFPS.value } old code relating to manual fps input
            if((fps == undefined || fps == 0) && precomp.layers[1].frameRate != undefined) { fps = precomp.layers[1].frameRate }
            if(fps == 0 || fps == undefined) { fps = 23.976 }

            //auto detect fps
            if(detectFPS.value) {
                if(debug.value) { writeToDebugFile("twixConstant: autodetecting FPS via detectFramerate...\n"); }
                fps = detectFramerate(precomp.layers[1]);
            }

            //add twixtor
            for(var i=1; i <=precomp.layers.length; i++) {
                precomp.layers[i]("Effects").addProperty("Twixtor Pro");
                try {
                    precomp.layers[i].Effects("Twixtor Pro")("In FPS is Out FPS").setValue(0);
                } catch (e) {
                    //do nothing
                }
                precomp.layers[i].Effects("Twixtor Pro")("Input: Frame Rate").setValue(fps);
            }
            if(debug.value) { writeToDebugFile("twixConstant: complete\n"); }
        }

        //Returns the FPS of a given layer.
        //Assumes constant FPS
        //Uses built-in extendscript stuff
        function detectFramerate(layer) {
            if(debug.value) { writeToDebugFile("detectFramerate: starting...\n"); }
            var fps = layer.source.frameRate;
            var precomp;
            var comp = layer.containingComp;
            //if fps doesn't match precomp layer and do testing in there
            if(comp.frameRate != fps) {
                precomp = comp.layers.precompose([layers[i].index], "TEMP", false);
                layer = precomp.layers(1);
            }

            var splits;

            if(File.fs != "Windows") {
                //forced to use extendscript detector
                if(debug.value) { writeToDebugFile("detectFramerate: detecting FPS via splitScene...\n"); }
                alert("Not a Windows computer- falling back to legacy framerate detector!");
                splits = splitScene(comp, layer);
            } else {
                //use more advanced python detector
                if(debug.value) { writeToDebugFile("detectFramerate: detecting FPS via pythonFPSDetector...\n"); }
                splits = pythonFPSDetector(comp, layer, false);
            }
            

            //fps based on averaging differences of all times
            // var random = genRand(0, splits.length-1, 0);
            // fps = 1 / (splits[random] - splits[random - 1]);
            if(splits.length > 0) {
                var tempfps = 0;
                tempfps += (splits[1] - splits[0]);
                for(var i=2; i < splits.length-1; i++) {
                    tempfps += 1 / (splits[i] - splits[i-1]);
                }
                fps = Math.round(tempfps / splits.length); //round to int
            }

            //clean up by removing precomp
            if(precomp != undefined && precomp != null) {
                precomp.remove();
            }
            return fps;
        }

        //cuts a clip by trying to detect where anims end and start
        //difficult, maybe not doable
        //probably need to do configurations to see where 1 starts and the other ends
        function twixVariable(precomp) {
            if(debug.value) { writeToDebugFile("twixVariable: starting...\n"); }
            var layer = precomp.layers[1];
            layer.timeRemapEnabled = true;
            var splits;
            if(debug.value) { writeToDebugFile("File.fs: " + File.fs + "\n"); }
            if(File.fs != "Windows") {
                //forced to use extendscript detector
                alert("Not a Windows computer- falling back to legacy framerate detector!");
                if(debug.value) { writeToDebugFile("twixVariable: Starting splitScene..\n"); }
                splits = splitScene(precomp, layer);
            } else {
                //use more advanced python detector
                if(debug.value) { writeToDebugFile("twixVariable: Starting fpsDetector..\n"); }
                splits = pythonFPSDetector(precomp, layer, false);
            }

            //set each fps change as a new frame
            if(splits.length > 0) {
                for(var i=0; i < splits.length-1; i++) {
                    layer.timeRemap.setValueAtTime(i/precomp.frameRate, parseFloat(splits[i]) + Math.abs(layer.startTime));
                }
                //shorten precomp duration to fps
            }

            return splits.length;
        }

        // modified from NTProduction's scene detect script, free online
        // returns every frame the scene changed
        function splitScene(comp, layer) {
            // lower = more sensitive, default = 100
            var threshold = 100; 
            var rText = comp.layers.addText();
            var gText = comp.layers.addText();
            var bText = comp.layers.addText();
        
            rText.property("Source Text").expression = 'targetLayer = thisComp.layer("'+layer.name+'"); samplePoint = [thisComp.width/2, thisComp.height/2]; sampleRadius = [thisComp.width,thisComp.height]; sampledColor_8bpc = 255 * targetLayer.sampleImage(samplePoint, sampleRadius, true, time); R = Math.round(sampledColor_8bpc[0]); text.sourceText = R';
            gText.property("Source Text").expression = 'targetLayer = thisComp.layer("'+layer.name+'"); samplePoint = [thisComp.width/2, thisComp.height/2]; sampleRadius = [thisComp.width,thisComp.height]; sampledColor_8bpc = 255 * targetLayer.sampleImage(samplePoint, sampleRadius, true, time); R = Math.round(sampledColor_8bpc[1]); text.sourceText = R';
            bText.property("Source Text").expression = 'targetLayer = thisComp.layer("'+layer.name+'"); samplePoint = [thisComp.width/2, thisComp.height/2]; sampleRadius = [thisComp.width,thisComp.height]; sampledColor_8bpc = 255 * targetLayer.sampleImage(samplePoint, sampleRadius, true, time); R = Math.round(sampledColor_8bpc[2]); text.sourceText = R';
        
            //writeToRGBFile(parseInt(rText.property("Source Text").value), parseInt(gText.property("Source Text").value), parseInt(bText.property("Source Text").value));
        
            var splitTimes = [];
        
            comp.time = 0;
            var ogR, ogG, ogB;
            var r, g, b;
            //var temp = readRGBFile();
            ogR = parseInt(rText.property("Source Text").value);
            ogG = parseInt(gText.property("Source Text").value);
            ogB = parseInt(bText.property("Source Text").value);
        
            var ogLuma, luma;
            ogLuma = (ogR+ogG+ogB)/3;
        
            var frameIncrement = 1; //go frame by frame
            var frameRate = Math.floor(1/comp.frameDuration);
            for(var i = comp.time*frameRate; i < comp.duration*frameRate; i+=frameIncrement) {
        
                // move forward in time
                comp.time += frameIncrement/frameRate;
                
                // write new values in file
                //writeToRGBFile(parseInt(rText.property("Source Text").value), parseInt(gText.property("Source Text").value), parseInt(bText.property("Source Text").value));
        
                //temp = readRGBFile();
                r = parseInt(rText.property("Source Text").value);
                g = parseInt(gText.property("Source Text").value);
                b = parseInt(bText.property("Source Text").value);
        
                luma = (r+g+b)/3;
                if(ogLuma / luma * 100 > threshold || luma / ogLuma * 100 > threshold) {
                    splitTimes.push(i/frameRate);
                }
        
                ogLuma = luma;
                ogR = r;
                ogG = g;
                ogB = b;
        
            }
            splitTimes.shift();
        
            //alert(splitTimes);
        
            rText.remove();
            gText.remove();
            bText.remove();
        
            return splitTimes;
            //layer.remove();
        }

        //python FPS detector.
        //returns a list of frames where the scene changes
        //if sendThreshold = true returns a second list with the corresponding thresholds
        function pythonFPSDetector(comp, layer, sendThreshold) {
            if(debug.value) { writeToDebugFile("pythonFPSDetector: starting...\n"); }
            //default value
            if(sendThreshold == undefined) { sendThreshold = false; }
            
            var splits = [];
            var thresholds = [];

            //give the python file info on what it's detecting
            var startTime = layer.inPoint + Math.abs(layer.startTime);
            var endTime = layer.outPoint;
            //ie: /g/Recording Footage/Tutorials/TwixtorAutomation/Violet Evergarden, Episode 1.mp4
            if(debug.value) { writeToDebugFile("Writing data to rgbFile: " + startTime + ", " + endTime + "\n"); }
            writeToRGBFile(startTime + "," + endTime);
            if(debug.value) { writeToDebugFile("Success.\n"); }
            //for use by the bash script later on
            var layerPath = layer.source.file.fsName;

            //need to make sure the bash and python files are in the same directory as this script
            var scriptFile = new File($.fileName); //references this file
            var scriptPath = scriptFile.parent; // leads to C:\Users\test\Documents\ae scripting
            if(scriptPath.getFiles("*.exe").length <= 0) {
                //check documents for it
                if(debug.value) { writeToDebugFile("Script path of " + scriptPath.fsName.toString() + " failed. Testing ~/Documents/...\n"); }
                scriptPath = "~/Documents/";
                if(scriptPath.getFiles("*.exe").length <= 0) {
                    if(debug.value) { writeToDebugFile("Script path of ~/Documents/ failed. Testing ~/../Documents/...\n"); }
                    scriptPath = "~/../Documents/";
                    if(scriptPath.getFiles("*.exe").length <= 0) {
                        if(debug.value) { writeToDebugFile("All script paths failed. Exiting...\n"); }
                        alert("Error: fps_detector.exe needs to exist in the same folder as this script or in Documents!");
                        return;
                    }
                }
            }
            if(debug.value) { writeToDebugFile("Script path set to: " + scriptPath.fsName.toString() + ".\n"); }

            var fpsFile = getRGBFile();
            if(!fpsFile.exists) {
                fpsFile = new File(bpmTextFilePath);
            }
            var myScriptPath = File(app.activeScript);
            //var myScriptName = myScriptPath.fullName; // Leads to /c/Program Files/Adobe/Adobe Illustrator CC 2017/Support Files/Content/Windows/tmp000000001
            //only works on windows bc its a bat file
            var os = $.os;
            if (os.indexOf("Windows") == -1) {
                alert("Error: Python FPS Detector only works with Windows. Falling back to Extendscript...");
                return splitScene(comp, layer);
            }
            if(debug.value) { writeToDebugFile("Creating and filling in bash script...\n"); }
            var batPath = String(scriptPath.fullName) + "/fps_analyzer.bat";
            var bashScript = File(batPath);
            if (!bashScript.exists) {
                bashScript = new File(batPath); // Create the bat file (actually sh file) if not existing
            }
            //scriptPath.fullName = absolute reference from beginning
            //bashScript.lineFeed = "Unix"; 
            bashScript.encoding = "UTF-8";
            bashScript.lineFeed = "Windows"; //since it's a .bat file need CRLF instead of LF
            bashScript.open("w") //write and destroy everything existing in the file. r for read, a for append to existing, e for read&append
            var bashScriptContents = ["@echo off\n", 
                                "echo ///////////////////////////////\n",
                                "echo Detecting fps...\n",
                                "echo ///////////////////////////////\n",
                                "\"" + String(scriptPath.fsName) + "\\fps_detector.exe\" \"" + String(layerPath) + "\"\n",
                                "echo Finished! This program will close in 5 seconds. You can also close it with Ctrl + C.\n",
                                "timeout 6\n"];
            for(var i=0; i <= bashScriptContents.length; i++) {
                bashScript.write(bashScriptContents[i]);
            }
            bashScript.close();
            if(debug.value) { writeToDebugFile("Executing bash script...\n"); }
            bashScript.execute(); // execute the bat file

            //now we need to watch rgb.txt for any changes
            var dataNotFound = true;
            var filesAmt = scriptPath.getFiles().length;
            var iterations = 0;
            while(dataNotFound) {
                $.sleep(1000);
                //read and detect if data has been dumped, then wait another second for all the data
                if(debug.value) { writeToDebugFile("Polling rgb.txt... \n"); }
                var data = readRGBFile();
                if(data != startTime + "," + endTime && data != "") {
                    if(debug.value) { writeToDebugFile("Recieved data from python file!\n"); }
                    $.sleep(1000);
                    //parse file
                    //alert("Data recieved!");
                    data = readRGBFile();
                    for(var i=0; i <= data.length-1; i++) {
                        tokens = data[i].split(",");
                        if(tokens.length == 2) {
                            splits.push(tokens[0]);
                            thresholds.push(tokens[1]);
                        }
                    }
                    dataNotFound = false;
                } else if(iterations > 30) { //30 seconds to get it
                    if(debug.value) { writeToDebugFile("Could not get data from python file.\n"); }
                    alert("Error: Could not analyze FPS of " + layer.name +" with python! Falling back to ExtendScript...");
                    return splitScene(comp, layer);
                }
                iterations++;
            }

            //delete fps file now that we're done with it
            fpsFile.remove();

            if(debug.value) { writeToDebugFile("Completed pythonFPSDetector on " + comp.name + ".\nSplits: " + splits.toString() + "\nThresholds: " + thresholds.toString() + "\n"); }
            if(sendThreshold) {
                return splits, thresholds;
            }
            return splits;
        }
        
        //writes contents to the rgb file.
        function writeToRGBFile(contents) {
            var rgbFile = getRGBFile();
            rgbFile.open("w");
            rgbFile.write(contents);
            rgbFile.close();
        }

        //writes contents to the debug file.
        function writeToDebugFile(contents) {
            var debugFile = File("~/Documents/debug.txt");
            //for some reason ~/ goes to User/username/OneDrive/ instead of User/username if you have onedrive installed
            //this normally wouldn't be a problem but we need to coordinate with the python file which uses User/username/
            if(debugFile.relativeURI.indexOf("OneDrive") != -1) {
                debugFile = File("~/../Documents/debug.txt");
            }
            debugFile.open("a");
            debugFile.write(contents);
            debugFile.close();
        }
        
        //returns data in the rgb file.
        function readRGBFile() {
            var rgbFile = getRGBFile();
            rgbFile.open("r");
            var data = rgbFile.read().split("\n");
            rgbFile.close();
        
            return data;
        }

        //gets the rgb file
        function getRGBFile() {
            var rgbFile = File("~/Documents/rgb.txt");
            //for some reason ~/ goes to User/username/OneDrive/ instead of User/username if you have onedrive installed
            //this normally wouldn't be a problem but we need to coordinate with the python file which uses User/username/
            if(rgbFile.relativeURI.indexOf("OneDrive") != -1) {
                rgbFile = File("~/../Documents/rgb.txt");
            }
            return rgbFile;
        }

        //grabs all the names of the given comp and returns them in a list.
        function getAllCompLayerNames(comp) {
            var layerNames = [];
            //start at 1 bc comp.layers starts at 1
            for(var i=1; i <= comp.layers.length; i++) {
                layerNames.push(comp.layers[i].name);
            }
            return layerNames;
        }

        //finds a layer in a comp based on it's name
        function findLayerFromName(comp, layerName) {
            for(var i=1; i<=comp.layers.length; i++) {
                if(comp.layers[i].name == layerName.toString()) {
                    return comp.layers[i];
                }
            }
            alert("Error: Could not find layer " + layerName.toString() + "!");
            return false;
        }

        //matches a name to a layer in a given comp
        function matchNameToLayer(name, comp) {
            for(var i=1; i < comp.layers.length; i++) {
                if(comp.layer(i).name == name) {
                    return comp.layer(i);
                }
            }
            return null;
        }

        win.onResizing = win.onResize = function() {
            this.layout.resize();
        };

        win instanceof Window
            ?
            (win.center(), win.show()) : (win.layout.layout(true), win.layout.resize());
    }

})(this);