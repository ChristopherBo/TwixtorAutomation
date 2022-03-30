//ahr_autoTwixtorv0.1.jsx
// Copyright (c) 2022 AHRevolvers. All rights reserved.
//
// This script will automatically setup twixtor for a user based on this article,
// section 4, steps 3a-3c: https://lolligerjoj.wordpress.com/2016/10/22/twixtor-on-anime-footage-and-ae-workflow-using-twixtor/
// Find more of these scripts on my channel https://www.youtube.com/c/AHRevolvers
//
//Changelog:
// - added a gui
//
//Todo:
// - check if user has twixtor installed
// - take in files
// - figure out scene detection using python
// - figure out how to get python to interact with ae DIRECTLY
// - figure out how to get a layer's source path
// - progress bar
//
//Legal stuff:
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// This script is provided "as is," without warranty of any kind, expressed
// or implied. In no event shall the author be held liable for any damages
// arising in any way from the use of this script.
(function ahr_autoTwixtor() {

    var ahr_autoTwixtor = new Object();	// Store globals in an object
	ahr_autoTwixtor.scriptName = "ahr_autoTwixtor";
	ahr_autoTwixtor.scriptTitle = ahr_autoTwixtor.scriptName + "v1.4";
	
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
    var mainWindow = new Window("palette", "AHRevolver's Auto Twixtor Script v0.1", undefined);
    mainWindow.orientation = "column";

    var mainGroup = mainWindow.add("group", undefined, "mainGroup");
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
    helpText.add("statictext", undefined, "Option 3b, 3c, and Scene Detection both use an external Python file to deal with", {name: "helpText"}); 
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
    var inputFPSGroup = groupPanel.add("group", undefined, "inputFPSGroup");
    inputFPSGroup.orientation = "row";
    var constantFPS = inputFPSGroup.add("radiobutton", undefined, "Constant Framerate (3a):");
    constantFPS.value = true;
    var inputFPS = inputFPSGroup.add("edittext", undefined, "");
    inputFPS.preferredSize.width = 35;
    inputFPS.preferredSize.height = 17;
    var cutFPS = groupPanel.add("radiobutton", undefined, "Framerate occasionally changes (3b)");
    cutFPS.value = false;
    var variableFPS = groupPanel.add("radiobutton", undefined, "Framerate changes often (3c)");
    variableFPS.value = false;
    var detectFPS = groupPanel.add("radiobutton", undefined, "Detect framerate changes (experimental)");
    detectFPS.value = false;
    var threeBText = groupPanel.add("statictext", undefined, "Note: 3b will auto-detect framerate.");

    //experimental features and misc buttons
    var autoCut = groupOptions.add("checkbox", undefined, "Scene Detection (multiple shots in each layer)");
    autoCut.value = false;
    var debug = groupOptions.add("checkbox", undefined, "Debug Program");
    debug.value = false;
    var setupButton = mainWindow.add("button", undefined, "Go!");

    mainWindow.center();
    mainWindow.show();

    setupButton.onClick = function() {
        mainWindow.close();

        //grab each layer and put them in a list
        var layers = [];
        var comp = app.project.activeItem;
        var firstLayer = findLayerFromName(comp, inLayer.selection);
        var lastLayer = findLayerFromName(comp, outLayer.selection);

        //if firstlayer's index is larger than lastlayer's swap what they are
        if(firstLayer.index > lastLayer.index) {
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
            var precomp = comp.layers.precompose([layers[i].index], "twix_"+ layers[i].name, false);
            precomp.parentFolder = twixFolder;
        }

        //iterate through all precomps and decide what to do
        for(var i=1; i <= twixFolder.numItems; i++) {
            if(constantFPS.value == true) { //3a
                twixConstant(twixFolder.item(i), 0);
            } else if(cutFPS.value == true) { //3b
                
            } else if(variableFPS.value == true) { //3c
                twixVariable(twixFolder.item(i));
            } else if(detectFPS.value == true) { //autodetect one of the top choices

            }
        }
    }

    //applies twixtor on a clip
    function twixConstant(precomp, fps) {
        //0 fps == default from GUI
        if(fps == 0) { fps = inputFPS.value }

        //add twixtor
        for(var i=1; i <=precomp.layers.length; i++) {
            precomp.layers[i]("Effects").addProperty("Twixtor Pro");
            precomp.layers[i].Effects("Twixtor Pro")("In FPS is Out FPS").setValue(false);
            precomp.layers[i].Effects("Twixtor Pro")("Input: Frame Rate").setValue(fps);
        }
    }

    //cuts a clip by trying to detect where anims end and start
    //difficult, maybe not doable
    function twixVariable(precomp) {
        
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

})();