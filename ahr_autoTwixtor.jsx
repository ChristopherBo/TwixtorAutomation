//ahr_autoTwixtor.jsx Version 1.0
// Copyright (c) 2022 AHRevolvers. All rights reserved.
//
// This script will automatically setup twixtor for a user based on this article,
// section 4, steps 3a-3c: https://lolligerjoj.wordpress.com/2016/10/22/twixtor-on-anime-footage-and-ae-workflow-using-twixtor/
// Find more of these scripts on my channel https://www.youtube.com/c/AHRevolvers
//
//Todo:
// - remove closeOnUse button if docked
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
closeOnUse = true;
animatedOn = 2;
sendToRenderQueue = false;

(function ahr_autoTwixtor(thisObj) {

    var ahr_autoTwixtor = new Object();	// Store globals in an object
	ahr_autoTwixtor.scriptName = "ahr_autoTwixtor";
	ahr_autoTwixtor.scriptTitle = ahr_autoTwixtor.scriptName + "v1.0";
    
    //////////////////////////////////////////
    //MAIN UI
    //////////////////////////////////////////
    scriptBuildUI(thisObj)
    function scriptBuildUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window('palette', "AHRevolver's Auto Twixtor Script v1.0", undefined, {
            resizeable: true
        });
        win.spacing = 0;
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
        helpText.add("statictext", undefined, "Options 3c and 3a(checked) use an external Python file to deal with image", {name: "helpText"}); 
        helpText.add("statictext", undefined, "detection. Scene Detection relies on an extremely experimental new feature", {name: "helpText"}); 
        helpText.add("statictext", undefined, "from AE v22.3+ and is very janky, expect bugs galore when attempting it.", {name: "helpText"}); 
        helpText.add("statictext", undefined, "", {name: "helpText"}); 
        helpText.add("statictext", undefined, "If you can't see certain features, your After Effects needs to be v22.3 or later.", {name: "helpText"}); 
        helpText.add("statictext", undefined, "", {name: "helpText"}); 
        helpText.preferredSize.width = 400;

        var topButtonGroup = mainGroup.add("group", undefined, "");
        topButtonGroup.orientation = "row";

        var helpButton = topButtonGroup.add("button", undefined, "?");
        helpButton.onClick = function() {
            helpWindow.center();
            helpWindow.show();
        }

        var refreshButton = topButtonGroup.add("button", undefined, "Refresh Layer Selection");
        refreshButton.onClick = function() {
            //reset lists
            inLayer.removeAll();
            outLayer.removeAll();

            //replace layer names from current comp
            var newNames = getAllCompLayerNames(app.project.activeItem);
            for(var i=0; i <= newNames.length; i++) {
                inLayer.add("item", newNames[i]);
                outLayer.add("item", newNames[i]);
            }

            //make selection something real, otherwise it'll be blank/not one of the options
            inLayer.selection = 0;
            outLayer.selection = 0;
            
            //remove leftover blank option
            inLayer.remove(newNames.length);
            outLayer.remove(newNames.length);
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
        var constantFPS = groupPanel.add("radiobutton", undefined, "Constant Framerate (3a)");
        constantFPS.value = false;
        //archived 3b because i doubt people will use it over 3c + requires algorithm
        // if(parseFloat(app.version.substring(0,4)) >= 22.3) { //only for ae v22.3 and above
        //     var cutFPS = groupPanel.add("radiobutton", undefined, "Framerate occasionally changes (3b) (UNTESTED)");
        //     cutFPS.value = false;
        // }
        var variableFPS = groupPanel.add("radiobutton", undefined, "Framerate changes often (3c)");
        variableFPS.value = true;

        //3a framerate
        var ThreeAGroup = groupOptions.add("panel", undefined, "3A Options");
        ThreeAGroup.visible = false; //make entire group start invis bc 3c is default
        var detectFPS = ThreeAGroup.add("checkbox", undefined, "Detect framerate(s) of clips");
        detectFPS.value = true;

        var ThreeAFramerateGroup = ThreeAGroup.add("group", undefined, "ThreeAFramerateGroup");
        ThreeAFramerateGroup.orientation = "row";
        ThreeAFramerateGroup.visible = false; //make the entire group invis by default
        var ThreeAText = ThreeAFramerateGroup.add("statictext", undefined, "New frame every:");
        var everyXFrames = ThreeAFramerateGroup.add("edittext", undefined, animatedOn);
        everyXFrames.preferredSize.width = 17;
        everyXFrames.preferredSize.height = 17;
        var ThreeAText = ThreeAFramerateGroup.add("statictext", undefined, "frames");

        //when detectFPS is on disable viewing the manual input and vice versa
        detectFPS.onClick = function() {
            if(!detectFPS.value) {
                ThreeAFramerateGroup.visible = true;
            } else {
                ThreeAFramerateGroup.visible = false;
            }
        }

        //when 3a is on turn on 3a group visibility & vice versa when 3a isn't selected
        constantFPS.onClick = function() {
            ThreeAGroup.visible = true;
        }
        // if(parseFloat(app.version.substring(0,4)) >= 22.3) { //only for ae v22.3 and above
        //     cutFPS.onClick = function() {
        //         ThreeAGroup.visible = false;
        //     }
        // }
        variableFPS.onClick = function() {
            ThreeAGroup.visible = false;
        }
        

        //experimental features and misc buttons
        if(parseFloat(app.version.substring(0,4)) >= 22.3) { //only for ae v22.3 and above
            var autoCut = groupOptions.add("checkbox", undefined, "Scene Detection (multiple shots in each layer) (EXPERIMENTAL)");
            autoCut.value = false;
        }

        //threshold- archived for now
        // var thresholdGroup = groupOptions.add("group", undefined, "thresholdGroup");
        // thresholdGroup.orientation = "row";
        // var thresholdText = thresholdGroup.add("statictext", undefined, "FPS Detection Threshold:");
        // var thresholdValue = thresholdGroup.add("edittext", undefined, threshold.toString());
        // thresholdValue.preferredSize.width = 25;
        // thresholdValue.preferredSize.height = 17;
        
        //misc options
        var sendToRender = groupOptions.add("checkbox", undefined, "Send Precomps to Render Queue");
        sendToRender.value = sendToRenderQueue;
        // var closeOnUseCheck = groupOptions.add("checkbox", undefined, "Close on Use?");
        // closeOnUseCheck.value = closeOnUse;
        var debug = groupOptions.add("checkbox", undefined, "Debug Program");
        debug.value = false;

        var setupButton = win.add("button", undefined, "Go!");

        setupButton.onClick = function() {
            //base checks before starting
            if(debug.value) { writeToDebugFile("Making sure there's an active project...\n"); }
            // Check that a project exists
            if (app.project === null) {
                alert("Project does not exist!");
                return false;
            }

            if(debug.value) { writeToDebugFile("Making sure there's an active comp...\n"); }
            // Check that an active comp exists
            if (app.project.activeItem === null) {
                alert("There is no active comp!");
                return false;
            }

            if(debug.value) { writeToDebugFile("Making sure Twixtor's installed...\n"); }
            // Check if twixtor's installed
            if(checkForTwixtor() == false) {
                alert("Twixtor is not installed!");
                return false;
            }

            // Check if 3a fps is reasonable if 3a is checked
            if(debug.value) { writeToDebugFile("Making sure 3a's constant is between 0 and 24...\n"); }
            if((parseInt(everyXFrames.value) < 0 || parseInt(everyXFrames.value) > 24) && constantFPS.value == true) {
                alert("3A needs to be animated between 0 and 24 frames!");
                return false;
            }

            //if the script exists outside of program files close it on being run
            //bc its prob being run as a script not a docked item
            if(debug.value) { writeToDebugFile("Checking if script is not in Program Files...\n"); }
            var scriptFile = new File($.fileName); //references this file
            var scriptPath = scriptFile.parent; // leads to C:\Users\test\Documents\ae scripting
            if(scriptPath.fsName.indexOf("Program Files") == -1) {
                if(debug.value) { writeToDebugFile("Script not in Program Files, closing window...\n"); }
                win.close();
                if(debug.value) { writeToDebugFile("Window closed.\n"); }
            }
            // if(closeOnUseCheck.value) {
            //     win.close();
            // }
            
            if(debug.value) { writeToDebugFile("Starting...\n"); }

            app.beginUndoGroup("Auto Twixtor Script");

            //grab each layer and put them in a list
            var layers = [];
            var comp = app.project.activeItem;
            var firstLayer = findLayerFromName(comp, inLayer.selection);
            var lastLayer = findLayerFromName(comp, outLayer.selection);

            //if firstlayer's index is larger than lastlayer's swap what they are
            if(debug.value) { writeToDebugFile("Checking first and last layer indexes...\n") }
            if(firstLayer.index > lastLayer.index) {
                if(debug.value) { writeToDebugFile("Swapping first and last layer\n") }
                firstLayer, lastLayer = lastLayer, firstLayer;
            }

            if(debug.value) { writeToDebugFile("Getting all layers into a single list...\n") }
            //base case just add the 1 layer
            if(firstLayer.index == lastLayer.index) {
                layers = [firstLayer];
            } else {
                //iterate through indexes and add list items
                for(var i=firstLayer.index; i <= lastLayer.index; i++) {
                    layers.push(comp.layer(i));
                }
            }
            if(debug.value) { writeToDebugFile("Success.\n") }

            if(parseFloat(app.version.substring(0,4)) >= 22.3) { //only for ae v22.3 and above
                //if there is multiple shots detect and cut
                if(autoCut.value == true) {
                    if(debug.value) { writeToDebugFile("Auto cutting...\n") }
                    //https://ae-scripting.docsforadobe.dev/layers/layer.html?highlight=Scene#layer-dosceneeditdetection
                    //iterate over layers and do scene detection
                    var times;
                    var tmpLayer;
                    var tmpLayers = [];
                    var removeList = [];
                    for(var i=0; i < layers.length; i++) {
                        tmpLayer = layers[i];

                        //make sure the layers time remap is turned off so scene detection works
                        tmpLayer.timeRemapEnabled = false;

                        //splits clip when it detects a diff clip
                        times = tmpLayer.doSceneEditDetection(SceneEditDetectionMode.NONE);

                        if(times.length > 1) {
                            //cut the clip on the times specified
                            var layer1 = tmpLayer;
                            var layer2;
                            var j=0;
                            while(j < times.length) {
                                layer2 = layer1.duplicate();
                                layer2.inPoint = times[j];
                                if(times[j+1] != undefined) {
                                    layer2.outPoint = times[j+1];
                                }

                                //duplicated layers are created above the og
                                layer2.moveAfter(layer1);
                                
                                tmpLayers.push(layer2);

                                //reset things
                                layer2 = layer1;
                                j++;
                            }
                            //remove og layer
                            removeList.push(layer2);
                            //layer2.remove();
                        }
                        
                    }
                    if(debug.value) { writeToDebugFile("Success.\n") }

                    //remove unwanted layers from layers and remove them from existence >:3
                    for(var i=0; i < removeList.length; i++) {
                        layers.splice(removeList[i].index, 1);
                        removeList[i].remove();
                    }

                    if(debug.value) { writeToDebugFile("Adding cutted layers to layerlist...\n") }
                    //tmpLayers now holds all the layers layers needs
                    //because all the old layers are invalid
                    if(tmpLayers.length > 0) {
                        for(var i=0; i < layers.length; i++) {
                            try {
                                //if its an existing video layer go
                                if(layers[i] instanceof AVLayer) {
                                    tmpLayers.push(layers[i]);
                                }
                            } catch (e) {
                                //do nothing- we expect it to fail when it hits objects that DNE anymore
                            }
                        }
                        layers = tmpLayers;
                    }

                    if(debug.value) { writeToDebugFile("Success.\n") }   
                }
            }

            if(debug.value) { writeToDebugFile("Starting to precomp layers...\n") }
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
                if(debug.value) { writeToDebugFile("//////////////////////////////////////////////////"); }
                if(debug.value) { writeToDebugFile("Twixtoring precomp " + precomp.name + "...\n"); }
                if(debug.value) { writeToDebugFile("//////////////////////////////////////////////////"); }
                //slice cuts off the first 5 letters- the twix_ part
                precompLayer = matchNameToLayer(precomp.name.slice(5), comp);
                if(constantFPS.value == true) { //3a
                    if(debug.value) { writeToDebugFile("Twix method 3a chosen.\n"); }
                    twixConstant(precomp, 0);
                } else if(variableFPS.value == true) { //3c
                    if(debug.value) { writeToDebugFile("Twix method 3c chosen.\n"); }
                    var keyframes = twixVariable(precomp);
                    //todo: change comp duration and time remap keyframes accordingly
                    precomp.duration = (keyframes - 1)/precomp.frameRate;
                    precompLayer.timeRemap.setValueAtTime(precompLayer.inPoint + (keyframes/comp.frameRate), (keyframes - 1)/precomp.frameRate);
                    precompLayer.timeRemap.removeKey(precompLayer.timeRemap.nearestKeyIndex(precompLayer.outPoint));
                    precompLayer.outPoint = precompLayer.inPoint + ((keyframes + 1)/comp.frameRate);
                }
                // if(parseFloat(app.version.substring(0,4)) >= 22.3) { //only for ae v22.3 and above
                //     if(cutFPS.value == true) { //3b
                //         if(debug.value) { writeToDebugFile("Twix method 3b chosen.\n"); }
                //         twixCut(precomp);
                //     }
                // }
                if(debug.value) { writeToDebugFile("Finished twixtoring precomp " + precomp.name + "\n"); }
            }
            
            //send all precomps to render queue if requested
            if(sendToRender.value) {
                if(debug.value) { writeToDebugFile("Adding all precomps to render queue...\n"); }
                for(var i=1; i <= twixFolder.numItems; i++) {
                    precomp = twixFolder.item(i);
                    precomp.openInViewer(); //make comp active
                    app.executeCommand(app.findMenuCommandId("Add to Render Queue"));
                }
                comp.openInViewer(); //reopen old comp in viewer
            }
            
            if(debug.value) { writeToDebugFile("autoTwixtor complete.\n"); }
            app.endUndoGroup();
        }

        //applies twixtor on a clip
        function twixConstant(precomp, fps) {
            if(debug.value) { writeToDebugFile("twixConstant: starting...\n"); }
            //0 fps == default from GUI
            //if gui is nothing set to preferences, otherwiselayer 1's fps
            //if layer 1 doesnt have fps set it to 23.976
            if((fps == undefined || fps == 0) && precomp.frameRate != undefined) { fps = 23.976 / parseInt(everyXFrames.text) }
            if(fps == 0 || fps == undefined) { fps = precomp.layers[1].frameRate }
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

            //if OS isn't windows use legacy detector, otherwise use python
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
                fps = tempfps / splits.length;
            }

            //figure out what dividend of the clip fps it matches closest to
            var smallest = 999;
            var tempFPS;
            for(var i=0; i <= 10; i++) {
                if(smallest > Math.abs((comp.frameRate/i) - fps)) {
                    smallest = Math.abs((comp.frameRate/i) - fps);
                    tempFPS = comp.frameRate/i;
                }
            }
            fps = tempFPS;

            //clean up by removing precomp
            if(precomp != undefined && precomp != null) {
                precomp.remove();
            }
            if(debug.value) { writeToDebugFile("detectFramerate: Complete. FPS:" + fps.toString() + "\n"); }
            return fps;
        }

        //UNFINISHED ARCHIVED function for 3b
        //feel free to contribute if you'd like
        //this requires pulling times with the motion detector, then figuring out patterns
        //in the frametimes between each animated frame
        //ex frametimes: 4 4 4 4 4 2 2 2 2 2 then split between 4 and 2 and put them into precomps and twixConstant individually
        //however we know it's definitely not that easy, there will probably be some irl error like: 4 4 5 4 2 3 3 4 3 1
        function twixCut(precomp) {
            if(debug.value) { writeToDebugFile("twixCut: starting...\n"); }
            //I wanted to add scene detection via https://ae-scripting.docsforadobe.dev/layers/layer.html?highlight=Scene#layer-dosceneeditdetection
            //but it only exists in ae v22.3+
            var layer = precomp.layers[1];

            //splits and precomps at edit points
            layer.doSceneEditDetection(SceneEditDetectionMode.SPLIT_PRECOMP);

            //go through each layer and apply 3a to them
            var layers = precomp.layers;
            for(var i=1; i < layers.length; i++) {
                twixConstant(layers[i]);
            }
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
            if(debug.value) { writeToDebugFile("twixVariable: Complete.\n"); }
            return splits.length;
        }

        // modified from NTProduction's scene detect script, free online
        // returns every frame the scene changed
        function splitScene(comp, layer) {
            if(debug.value) { writeToDebugFile("splitScene: Starting...\n"); }
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
        
            rText.remove();
            gText.remove();
            bText.remove();
        
            if(debug.value) { writeToDebugFile("splitscene completed. splits: " + splitTimes + "\n"); }
            return splitTimes;
            //layer.remove();
        }

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
                //fallback on documents for it, which is hopefully a temporary measure
                if(debug.value) { writeToDebugFile("EXE path of " + scriptPath.fsName.toString() + " failed. Testing ~/Documents/...\n"); }
                try{
                    scriptPath = new Folder("~/Documents/");
                    if(scriptPath.getFiles("*.exe").length <= 0) {
                        if(debug.value) { writeToDebugFile("EXE path of ~/Documents/ failed. Testing ~/../Documents/...\n"); }
                        scriptPath = new Folder("~/../Documents/");
                        if(scriptPath.getFiles("*.exe").length <= 0) {
                            if(debug.value) { writeToDebugFile("All exe paths failed. Exiting...\n"); }
                            alert("Error: fps_detector.exe needs to exist in the same folder as this script or in Documents!");
                            return;
                        }
                    }
                } catch(err) {
                    if(debug.value) { writeToDebugFile("ERROR CAUGHT: " + err + "\n"); }
                    alert(err);
                    return;
                }
            }
            if(debug.value) { writeToDebugFile("EXE path set to: " + scriptPath.fsName.toString() + ".\n"); }

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
            if(debug.value) { writeToDebugFile("Creating bash script...\n"); }
            var batPath = String(scriptPath.fullName) + "/fps_analyzer.bat";
            var bashScript = createBashScript(batPath); //create bash script

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
            if(debug.value) { writeToDebugFile("Filling in bash script...\n"); }
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

            if(debug.value) { writeToDebugFile("Removing temp files...\n"); }
            //delete fps file now that we're done with it
            fpsFile.remove();
            bashScript.remove();

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
            if(comp == null || comp == undefined) {
                return layerNames;
            } else if(!(comp instanceof CompItem)) { //if its a layer or smt else go up to the containing comp
                comp = comp.containingComp;
            }
            //start at 1 bc comp.layers starts at 1
            for(var i=1; i <= comp.layers.length; i++) {
                layerNames.push(comp.layers[i].name);
            }
            return layerNames;
        }

        //creates the bash file
        function createBashScript(batPath) {
            if(batPath == undefined) { batPath = String(scriptPath.fullName) + "/fps_analyzer.bat"; }
            var scriptFile = new File($.fileName); //references this file
            var scriptPath = scriptFile.parent; // leads to C:\Users\test\Documents\ae scripting
            var bashScript = File(batPath);
            if(!bashScript.exists) {
                //alert("Creating file!");
                bashScript = new File(batPath);
            }
            overwriteToFile(bashScript, ""); //for some reason i need to write to this or it wont create the script

            //if the file wasnt able to be created make it in places we know SHOULD work, aka documents
            //this contingency is meant to cover dockable as files cant be created or executed in program files
            if(!bashScript.exists) {
                if(debug.value) { writeToDebugFile("Bash script location " + scriptPath.fsName.toString() + " failed. Trying ~/Documents/...\n"); }
                try {
                    bashScript = File("~/Documents/fps_analyzer.bat"); //TODO: if correct this is causing a file explorer window to popup at the location. fix it!
                    if(!bashScript.exists) { //if the bash file doesn't exist create it
                        bashScript = new File(batPath);
                    }
                    overwriteToFile(bashScript, ""); //need to write to the file to have the script actually create it for some reason
                    //if it still doesn't exist the script doesn't have perms or the folder doesn't exist. try the next destination
                    if(!bashScript.exists) {
                        if(debug.value) { writeToDebugFile("Bash script location ~/Documents/ failed. Trying ~/../Documents/...\n"); }
                        bashScript = File("~/../Documents/fps_analyzer.bat");
                        if(!bashScript.exists) { //if the bash file doesn't exist create it
                            bashScript = new File(batPath);
                        }
                        overwriteToFile(bashScript, "");
                        if(!bashScript.exists) { //nothing worked, fallback to legacy motion detection
                            if(debug.value) { writeToDebugFile("All bash script locations failed. Exiting...\n"); }
                            alert("ERROR: Could not create bash script file! Make sure Write perms are enabled in Edit > Preferences!");
                            return splitScene(comp, layer);
                        }
                    }
                } catch(err) {
                    alert(err);
                    if(debug.value) { writeToDebugFile("ERROR CAUGHT: " + err + "\n"); }
                    return;
                }
            }
            return bashScript;
        }

        //helper function to createBashScript
        function overwriteToFile(file, contents) {
            file.open("w");
            file.write(contents);
            file.close();
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

        //checks if Twixtor is installed
        function checkForTwixtor(){
            var effects = app.effects;
            for (var i = 0; i < effects.length; i++){
                if (effects[i].displayName == "Twixtor Pro") {
                    return true;
                }
            }
            return false;
        }

        //dont touch
        //somehow helps with making the window dockable
        win.onResizing = win.onResize = function() {
            this.layout.resize();
        };

        win instanceof Window
            ?
            (win.center(), win.show()) : (win.layout.layout(true), win.layout.resize());
    }

})(this);