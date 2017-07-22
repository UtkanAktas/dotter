/*!
MIT License

dotter jQuery plugin - http://webfikri.com/dotter

Copyright (c) 2017 Utkan AKTAŞ

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


;(function($, window, document, undefined){
	"use strict";
	//---------------------------------
			//CONSTANTS
	//---------------------------------
	var _pluginName = "dotter",
		_defaults = {
			//general options
			dotInnerHTML:'',
			dotWidth:6,// width for dot
			dotMargin:4,//margin between dots
			startPosition:["0","0"],//number | yüzde (top, left)
			hide:false,//this settings gives an opportunity to hide on certain breakpoint
			
			//LineOptions
			target:false,//selector | jquery object | DOM node
			endPosition:["0","0"],
			curve:false,//false | number(px) | number(%)
			curveCount:2,
			curveReverse:false,
			
			//elipse & rectangle options
			relativeToHost:false,// when it is true given width and height as px will be added to host dimensions
			alignToHost:false,//this will overwride startPosition option and shape will be centered over host element
			width:"100%",//px || % 
			height:"100%",
			
			responsive:[]//array for responsive settings

		},
		_types = {
			"line":true,
			"elipse":true,
			"rectangle":true
		},
		_dotTag = "div",//tag name for dots
		_class = "dot dot-",//constant for classes names for dots
		_wrpClass = "dotter-wrp",
		_util;//utility object

		



		
		function PLUGIN(element, type, options){
			var pos;//position property of host element
			var settings;//this will hold initial settings
			//type ==== string
			//options === object
			this.element = element;
			this.id = 0;//this is id number of this plugin on $(node).data()
			this.$el = $(element);//element wrapped by jquery
			this.responsive = {
				"init":{},
				keys:[]//keys will hold key of breakporints as a number and this will be sorted ascending
			};//if break points is set this will hold settings for all breakpoints
			this.wrapper = null;//wrapper element for dots
			this.wrpClass = "";//class name for wrapper object
			this.type = type;
			this.target = null;//target element for "line"
			settings = $.extend({},_defaults,options);
			this.settings = $.extend({},_defaults,options);
			this._defaults = _defaults;
			this._name = _pluginName;
			
			
			this.destroy = function(){
				var data = $.data( this.element , "plugin_" + _pluginName );
				
				if(this.wrapper){
					this.element.removeChild( this.wrapper );	
				}
				this.wrapper = null;
				
				this.$el = null;
				this.responsive = null;
				this.settings = null;
				settings = null;
				this.target = null;
				this._defaults = null;
				this.selfRebuild = function(){};
				
				//remove plugin from node.data object
				/*
				delete data[this.id];
				data.length -=1;*/
				
				data[this.id] = null;
				$.data( this.element , "plugin_" + _pluginName, data );
				

				this.element = null;
				return true;
				
				
			};
			
			//check target element
			if(this.settings.target){
				//if its jquery object
				if(this.settings.target instanceof jQuery){
					this.target = this.settings.target[0];
				}
				
				//else
				this.target = $( this.settings.target )[0];
			}
			
			
			//check there is any responsive settings
			
			if(this.settings.responsive.length){
				this.responsive["init"] = this.storeResponsiveSettings( this.settings.responsive, settings );
				
				
				//on first iteration set options for break points
				this.setOptions( this.getCurrentOptions( this.responsive.keys ) );
				
			}
			
			
			
			//add event listener on window resize
			this.onWindowResize( this.responsive.keys );
			
			
			
			//check host element's position property
			//javascript way to get css property of element doesnt work on ie8 and below
			//u can use getComputedStyle() for ie9+ if u wish
			pos = this.$el.css("position");
			
			//set position to relative if its necessary
			if(pos !== "relative" && pos !== "absolute" && pos!=="fixed"){
				this.element.style.position = "relative";
			}
			
			
			
			//check for wrapper classs
			this.wrpClass = _wrpClass + this.checkWrpClass( this.element );
			

			this.init();

			
		}
		
		$.extend(PLUGIN.prototype,{
			init:function(){
				
				
				//check type is valid
				if( !_types[ this.type ] ){ 
					return $(this.element);
				}
				//check for hide
				if(this.settings.hide){
					//remove wrapper if there is one and finish the job
					if(this.wrapper){
						this.element.removeChild( this.wrapper );
						this.wrapper = null;
					}
					//fnish to rebuild in here
					return this;
				}
				
				
				//call constructor function for relevant type
				switch( this.type ){
					case "line":
						this.buildLine();
					break;
					
					default:
						this.buildShape();
					break;
					
				}
				
				return this;
			},
			
			buildLine:function(){
				var hostDim;//it holds dimensions of host element
				var targetDim;//it holds dimensions of target element
				var wrp = "div";//conteiner element for line
				var s;//start position for fist dot
				var e;//end position for last dot


				//get dimensions of host element; 
				hostDim = _util.getNodeDimensions( this.element );
				
				targetDim = _util.getNodeDimensions( this.target );
				
				//calculate start position relative to viewport
				s = this.calculatePosition( hostDim , this.settings.startPosition);
				
				//calculate end position relative to viewport
				e = this.calculatePosition( targetDim , this.settings.endPosition);
				
				
				
				//create container element on start position
				wrp = document.createElement( wrp );
				
				wrp.setAttribute("class",this.wrpClass);
				wrp.style.position = "absolute";
				wrp.style.top = ( s.top - hostDim.top ) + "px";
				wrp.style.left = ( s.left - hostDim.left) + "px";
				this.wrapper = wrp;
				/*
				wrp.style.width = "1px";
				wrp.style.height = "1px";
				wrp.style.backgroundColor = "#FFFFFF";*/
				
				//append conteiner to host element
				this.element.appendChild( wrp );
				
				
				if(!this.settings.curve){
					//creates flat line
					this.createFlatLine(s, e, wrp);
				}else{
					this.createWave(s, e, wrp);
				}

				
			},
			buildShape:function(){
				var hostDim;//it holds dimensions of host element
				var dim;//it will hold dimensions of elpse or rectangle that will be created
				var dimSetup;//dimension settings.
				var wrp = "div";//conteiner element for line
				var s;//start position for fist dot


				//get dimensions of host element; 
				hostDim = _util.getNodeDimensions( this.element );
				
				
				//prepare settings for dimension calculation
				dimSetup = {
					relativeToHost: this.settings.relativeToHost,
					width:this.settings.width,
					height:this.settings.height
				};
				
				//get dimensions
				dim = this.calculateDimensions( hostDim, dimSetup );
				
				if(this.settings.alignToHost){
					//calculate start position relative to viewport and aligned to host element
					s = this.alignToHost( hostDim, dim, ["center","center"] );
				}else{
					//calculate start position relative to viewport
					s = this.calculatePosition( hostDim , this.settings.startPosition);
				}
				
				
				//create container element on start position
				wrp = document.createElement( wrp );
				wrp.setAttribute("class",this.wrpClass);
				wrp.style.position = "absolute";
				wrp.style.top = ( s.top - hostDim.top ) + "px";
				wrp.style.left = ( s.left - hostDim.left) + "px";
				this.wrapper = wrp;
				
				
				//append conteiner to host element
				this.element.appendChild( wrp );
				
				
				if(this.type==="elipse"){
					
					this.createElipse( s, dim, wrp );
					
				}else if(this.type==="rectangle"){
					
					this.createRectangle( s, dim, wrp );
					
				}
				
				
			},
			createFlatLine:function(start, end, wrp){
				//start === start position of line 
				//end === end position of line
				//wrp === wrapper element for dots
				var angle,//angle between start and end points
					margin,//margin between every dots
					startM,//margin at the start point
					endM,//margin at the end point
					distance,//distance between start and end points
					len,//how many dots will be created
					attr,//object that will hold attribute list of node
					style,//object that will hold style list of node
					inner,//innerHTML for every node
					i = 0,
					lastPos,//position of last created node
					dim;//dimension of an dot
					
				//margin between dots
				margin = this.settings.dotMargin;
				//on this version dots can be only equal width and height
				dim = this.settings.dotWidth;
				
				//node attribute
				attr = {};
				
				//node style
				style = {
					"width":dim + "px",
					"height":dim + "px"	
				};
				
				
				
				
				
				//calculate angle between start and end points	
				angle = Math.atan2(-1*(end.top - start.top), end.left - start.left);

				//calculate distance
				distance = Math.pow( end.top - start.top, 2 ) + Math.pow( end.left - start.left, 2 );
				distance = Math.sqrt( distance );
				
				//calculate len ( how many dots will be created )
				len = Math.floor(distance / ( dim + margin ));
				
				//calculate start and end margin
				startM = endM = (distance - ( ( len * dim ) + ( (len-1) * margin ) ) ) / 2;
				
				
				
				//create dots
				for( ; i < len ; i++){
					
					//on first iteration last position is equal to start margin
					if(i === 0){
						lastPos = startM;
					}else{
						lastPos += margin + dim;
					}
					
					//calculate x and y
					style.top = (-1 * Math.sin(angle) * ( lastPos + dim/2) );
					style.top = style.top - dim/2;
					style.top = (Math.round(style.top * 100)/100).toFixed(2) + "px";
					style.left = (Math.cos(angle) * ( lastPos + dim/2));
					style.left = style.left - dim/2;
					style.left = (Math.round(style.left * 100)/100).toFixed(2) + "px";
					
					attr["class"] = _class + i;
					
					//get inner HTML
					inner = this.getInnerHTML( i );
					
					//create and append node
					wrp.appendChild( _util.createNode( _dotTag, attr, style, inner ) );
					
					
				}
				
				
				
				
				
			},
			createWave:function(start, end, wrp){
				//start === start position of line 
				//end === end position of line
				//wrp === wrapper element for dots
				var angle,//angle between start and end points
					sinAngle,//sinus of angle
					cosAngle,//cosinus of angle
					margin,//margin between every dots
					startM,//margin at the start point
					endM,//margin at the end point
					distance,//distance between start and end points
					len,//how many dots will be created
					attr,//object that will hold node attribute list
					style,//object that will hold node style list
					curve,
					curveReverse,//direction of curve
					curveCount,//count of curves
					inner,//innerHTML for every node
					i = 0,
					x,y,//after rotate new top and left values
					lastPos,//position of last created node
					dim;//dimension of an dot
					
				//margin between dots
				margin = this.settings.dotMargin;
				//on this version dots can be only equal width and height
				dim = this.settings.dotWidth;

				//get reverse
				curveReverse = this.settings.curveReverse ? -1 : 1;
				
				//get curve Count
				curveCount = this.settings.curveCount;
				
				//node attribute
				attr = {};
				
				//node style
				style = {
					"width":dim + "px",
					"height":dim + "px"	
				};
				
				
				
				
				//calculate angle between start and end points	
				angle = Math.atan2(-1*(end.top - start.top), end.left - start.left);
				
				
				
				
				//calculate sinus of angle
				sinAngle = Math.sin( angle );
				cosAngle = Math.cos( angle );
								
				//calculate distance
				distance = Math.pow( end.top - start.top, 2 ) + Math.pow( end.left - start.left, 2 );
				distance = Math.sqrt( distance );
				
				//get curve
				curve = _util.getValueAndType( this.settings.curve );
				
				//if curve set as percent of distance
				if(curve[1] === "%"){
					curve[0] = distance /100 * curve[0];
				}
				
				//calculate len ( how many dots will be created )
				len = Math.floor(distance / ( dim + margin ));
				
				//calculate start and end margin
				startM = endM = (distance - ( ( len * dim ) + ( (len-1) * margin ) ) ) / 2;
				
				
				
				//create dots
				for( ; i < len ; i++){
					
					//on first iteration, last position is equal to start margin
					if(i === 0){
						lastPos = startM;
					}else{
						lastPos += margin + dim;
					}
					
					//calculate x and y
					style.top =(curveReverse*curve[0] * Math.sin( (lastPos + dim/2) / distance*Math.PI*curveCount ) );
					style.left = ( lastPos + dim/2);
					
					//rotate axes
					x = style.left  * cosAngle - style.top * sinAngle;
					y = style.top * cosAngle + style.left * sinAngle;
					
					//correction dots position becaouse of dots dimensions				
					style.top = y - dim/2;
					style.left = x - dim/2;
					
					//correction for HTML axis
					style.top = style.top * -1;
					
					style.top += "px";
					style.left += "px";
					

					attr["class"] = _class + i;
					
					//get inner HTML
					inner = this.getInnerHTML( i );
					
					//create and append node
					wrp.appendChild( _util.createNode( _dotTag, attr, style, inner ) );
					
					
				}
				
				
				
				
			},
			createElipse:function(start, dim, wrp){
				//functin creates eliptic shape and add it to given wrapper element
				//start=== start position of shape
				//dim === dimension of shape
				//wrp === container element for shape
				
				var circum,// Circumference of elipse
					margin = this.settings.dotMargin,//margin between dots
					dotDim = this.settings.dotWidth,//dimension of dots
					dimR ,//radius of dotDim
					rx,//raidius on x axis
					ry,//radius on y axis
					my,//multiplier for y
					ap,//piece of angle that will be calculated by 360 / count
					lastAp,
					attr,//object that will hold node attribute list
					style,//object that will hold node style list
					x,
					y,
					inner,//innerHTML for every node
					i = 0,
					count;//number of dots
				
				//calculate radius of dotDim
				dimR = dotDim / 2;
				
				//node attribute
				attr = {};
				
				//node style
				style = {
					"width":dotDim + "px",
					"height": dotDim+ "px"	
				};
				
				//get inner HTML
				inner = this.settings.dotInnerHTML;
				
				//calculate raidius for x and y axis
				rx = dim.width / 2;
				
				ry = dim.height / 2;
				
				//calculate multiplier of y
				my = ry / rx;
				
				
				//calculate Circumference of elipse
				circum = ( Math.PI * dim.height /2 ) + ( Math.PI * dim.width /2 );
				
				
				//calculate how many dots will be added
				count = Math.round( circum / (margin + dotDim) );
				
				
				//calculate actual margin
				//margin = ( circum - (dotDim * count) ) / count;
				
				//calculate ap
				ap = Math.PI * 2 / count;
				lastAp = 0;
				
				//create dots
				for( ; i<count ; i++){
					
					//calculate x and y
					x =  rx * Math.cos(lastAp);
					y = my * rx * Math.sin(lastAp);
					
					lastAp += ap;
					
					//correction dots position becaouse of dots dimensions				
					style.top = y - ry +dimR ;
					style.left = x + rx - dimR; 
					
					//correction for HTML axis
					style.top = style.top * -1;
					
					style.top += "px";
					style.left += "px";

					attr["class"] = _class+i;
					
					//get inner HTML
					inner = this.getInnerHTML( i );
					
					//create and append node
					wrp.appendChild( _util.createNode( _dotTag, attr, style, inner ) );

					
				}
				
				
				
			},
			createRectangle:function(start, dim, wrp){
				//functin creates rectangle shape and add it to given wrapper element
				//start=== start position of shape
				//dim === dimension of shape
				//wrp === container element for shape
				var peri,// perimeter of rectangle
					lastPeri,//legnth of line that created so far by adding dots
					margin = this.settings.dotMargin,//margin between dots
					dotDim = this.settings.dotWidth,//dimension of dots
					vertM,//margin on vertical sides
					horiM,//margin fon horizantal sides
					len,//object that will hold length to a corner
					count,//count of dots
					horiCount,//count of dots on one horizantal side
					vertCount,//count of dots on one vertical side
					dimR ,//radius of dotDim
					attr,//object that will hold node attribute list
					style,//object that will hold node style list
					x,
					y,
					rightF,//first iteration on the right side
					leftF,//first iteration on the right side
					inner,//innerHTML for every node
					i = 0;
					
					
				//calculate perimeter of rectangle
				peri = dim.width * 2 + dim.height * 2;
				
				//find out dot count on one horizantal side
				horiCount = ( dim.width / ( dotDim + margin ) ) + 1;
				horiCount = Math.round( horiCount );
				
				//calculate actual margin on horizantal side
				horiM = ( dim.width - ( horiCount * dotDim ) ) / ( horiCount - 1 );
				
				//find out dot count on one vertical side
				vertCount = ( dim.height / ( dotDim + margin ) ) -1;
				vertCount = Math.round( vertCount );
				
				//calculate actual margin on vertical side
				vertM = ( dim.height - ( ( vertCount + 2 ) * dotDim ) ) / ( vertCount + 1 );
				
				//calculate total count
				count = (horiCount*2) + (vertCount*2);
				
				//calculate radius of dotDim
				dimR = dotDim / 2;
				
				//calculate corners
				len = {
					topRight:horiCount,
					bottomRight:horiCount + vertCount,
					bottomLeft: (horiCount * 2) + vertCount
				};
				
				//node attribute
				attr = {};
				
				//node style
				style = {
					"width":dotDim + "px",
					"height": dotDim+ "px"	
				};
				
				//get inner HTML
				inner = this.settings.dotInnerHTML;
				
				lastPeri = 0;
				//create dots
				for( ; i < count ; i++){
					
					if( i >= 0 && i < len.topRight ){
						
						y = 0;
						x = lastPeri;
						if(i+1 === horiCount){
							lastPeri += dotDim;
						}else{
							lastPeri += dotDim + horiM;
						}
						
					}else
					
					if( i >= len.topRight && i < len.bottomRight ){
						
						//on first iteration
						if(!rightF){
							
							rightF = true;
							lastPeri += (vertM + dotDim);
							
						}
						
						y = lastPeri - dim.width;
						x = dim.width - dotDim;
						
						lastPeri += vertM + dotDim;
						
					}else
					
					if(i >= len.bottomRight && i < len.bottomLeft){
						y = dim.height - dotDim;
						x = dim.width - (lastPeri - (dim.height + dim.width - ( dotDim *2)));
						if(i+1 === horiCount){
							lastPeri += dotDim;
						}else{
							lastPeri += dotDim + horiM;
						}
					}else
					
					if(i >= len.bottomLeft){
						//on first iteration
						if(!leftF){
							
							leftF = true;
							lastPeri = dim.width*2 + dim.height + vertM + dotDim*2;
							
						}
						
						y = dim.height - (lastPeri - (dim.width * 2 + dim.height));
						x = 0;
						
						lastPeri += vertM + dotDim;
						
					}
					
					
					
					//correction dots position becaouse of dots dimensions				
					style.top = y +"px";
					style.left = x +"px"; 

					attr["class"] = _class+i;
					
					//get inner HTML
					inner = this.getInnerHTML( i );
					
					//create and append node
					wrp.appendChild( _util.createNode( _dotTag, attr, style, inner ) );
					
				}
				
				
				
				
			},
			calculatePosition:function( elementRect, position ){
				//nodeRect === return value of getBoundingClientRect() for current elemnt
				//position === is Array that holds top and left value of position
				
				//function calculates given position relative to element's postion
				//return value is in px
				
				var top,//result of top position
					left;//result of left position
					
					//get position value and it's type ( % or px )
					top = _util.getValueAndType( position[0] );
					left = _util.getValueAndType( position[1] );

					//calculate top
					if( top[1] === "px" ){
						top = top[0] + elementRect.top;
					}else if ( top[1] === "%" ){
						top = ( top[0]*elementRect.height/100 ) + elementRect.top;
					}
					
					//calculate left
					if( left[1] === "px" ){
						left = left[0] +  elementRect.left;
					}else if ( left[1] === "%" ){
						left = ( left[0]*elementRect.width/100 ) + elementRect.left;
					}
					
				return {top:top, left:left};
				
			},
			alignToHost:function( host, shape, align ){
				//function will align shape to its host at given align
				//host === object that holds host dimensions
				//shape === object htat holds shape dimensions
				//align === array [ top, left ] that holds align type in string
				var difW,//difference beteween host.width and shape.width
					difH,//difference beteween host.height and shape.height
					result = {};//object that will hold new top and left value
				difW = host.width - shape.width;
				difH = host.height - shape.height;
				
				//vertical align
				switch(align[0]){
					case "center":
						result.top = host.top + ( difH/2 );
					break;
					
						//other cases will be added on furter updates
					
					default:
						result.top = host.top + ( difH/2 );
					break;
				}
				
				//horizantal align
				switch(align[1]){
					case "center":
						result.left = host.left + ( difW/2 );
					break;
					
						//other cases will be added on furter updates
					
					default:
						result.left = host.left + ( difW/2 );
					break;
				}
				
				return result;
				
			},
			calculateDimensions:function( hostDim, setup ){
				//function will calculate dimension for new element
				//it could be relative to host or not
				//hostDim === dimension of host element
				//setup === setting for calculation{ relativeToHost, width, height}
				var result = {};
				
				//get dimension values and types of them
				setup.width = _util.getValueAndType( setup.width );
				setup.height = _util.getValueAndType( setup.height );
				
				//calculate width
				if(setup.width[1]==="px"){
					if(setup.relativeToHost){
						result.width = setup.width[0] + hostDim.width; 
					}else{
						result.width = Math.abs( setup.width[0] );
					}
				}else if (setup.width[1] === "%"){
					result.width = hostDim.width / 100 * setup.width[0];
				}
				
				
				//calculate height
				if(setup.height[1]==="px"){
					if(setup.relativeToHost){
						result.height = setup.height[0] + hostDim.height; 
					}else{
						result.height = Math.abs( setup.height[0] );
					}
				}else if (setup.width[1] === "%"){
					result.height = hostDim.height / 100 * setup.height[0];
				}
				
				//check negative value in result
				if(result.width < 0){
					result.width = 0;
				}
				
				if(result.height < 0){
					result.height = 0;
				}
								
				return result;
				
			},
			storeResponsiveSettings:function( array, settings ){
				//function will store all responsive settings in this.responsive object
				//responsive[key]  repsresents break points and its value is object that holds
				//settings for this break point
				
				//array === an array that holds responsive settings that given by user
				//settings === initial settings of plugin
				var len = array.length,
					k,//it will hold key value in for loop
					cur,//current object in for loop
					curK,//key value for currrent breakpoint
					curS,//object that holds current settings in for loop
					i = 0;
				
				
				
				
				//check for all other break points
				for( ; i < len ; i++){
					cur = array[i];
					
					//check is break point propery set as properly
					if( cur &&  typeof cur.breakPoint === "number"){ 
						curK = cur.breakPoint;
					}else{
						continue;	
					}
					
					//check is there a settings and is it a properly object
					if(cur.settings && _util.isObject( cur.settings )){ 
						curS = cur.settings; 
					}else{
						continue;
					}
					
					//create object in this.responsive with key
					this.responsive[curK] = {};
					
					////add break point key to keys array
					this.responsive.keys.push( curK );
					
					//asign settings
					for(k in curS){
						if(curS.hasOwnProperty([k])){
							if(typeof this.settings[k] !== "undefined"){
								
								this.responsive[curK][k] = curS[k];
							}
							
						}
					}
				}
				
				//sort keys in this responsive
				this.responsive.keys.sort(function(a,b){return a - b;});
				
				
				//delete responsive settings
				delete settings.responsive;
		
				return settings;	
			},
			rebuild:function( options ){
				//function removes existing wrapper element and all its content and re initiate plugin
				
				//options === object that caries setting for overwrite global settings
				
				
				this.setOptions( options );
				
				//with current settings
				if(this.wrapper){
					this.element.removeChild( this.wrapper );
					this.wrapper = null;
				}
				
				this.init();
				
				return this;
				
			},
			getCurrentOptions:function( keys ){
				var len,//length of keys ( breakpoints )
					curOpt = {},//option for breakpoints that will be used as current settings for currrent window
					v,//window width
					i = 0;
					
				
				//get lenght of keys	
				len = keys.length;
				//get wiewport width
				v = _util.getViewPort();
				
				
				if( len ){
					//if there is any given breakpoint find out which one will be used
					for( ; i <= len ; i++){
						//if doesnt match any break point "else" settings will be used
						if(i === len){
							curOpt = this.responsive["init"];
							
						}else
						//if there is any match
						if(v <= keys[i]){
							curOpt = this.responsive[keys[i]];
							break;
						}
					}
				}
				
				return curOpt;	
			},
			checkWrpClass:function( host ){
				//function will check there is any wrp element added by another instant of dotter
				//and return a number for current wraper
				//host === host element that dotter instance had been  added
				var class_,//class list for current node
					reg = /dotter-wrp(\d+)/i,
					wrpIndex = 0,//index number for this.wrapper object
					nLen,//node list lenght
					i = 0,//for node list loop
					ii = 0,//for class list loop
					cLen,//classes lenght
					test,//it holds matches for regex
					curNode,//current node
					nodes;//child nodes of host element
				
				nodes = host.childNodes;
				nLen = nodes.length;
				
				//check for wrapper element
				for( ; i < nLen ; i++){
					curNode = nodes[i];
					class_ = curNode.className;
					if(typeof class_ === "string"){
						class_ = class_.split(" ");
						cLen = class_.length;
						
						//check reg on each class
						for( ; ii < cLen ; ii++){
							test = class_[ii].match(reg);
							//if there is a match get last index
							if(test){
								wrpIndex = parseInt( test[1], 10 )+1;
							}
						}
						//reset ii
						ii = 0;
					}
				}

				return wrpIndex;

			},
			setOptions:function( options ){
				var k ;//key holder in for loop
				
				options = options || {};
				
				//overwrite current settings
				for(k in options){
					
					if( options.hasOwnProperty(k)){
						if(typeof this.settings[k] !== "undefined"){
							this.settings[k] = options[k];
						}
					}
				}
			},
			onWindowResize:function( keys ){
				//keys === array that holds breakpoint positions if there is
				var self = this;

				$(window).on("resize",function(){
					self.selfRebuild( keys );
				});
			},
			selfRebuild:function( keys ){
				var options;
				//keys === array that holds breakpoint positions if there is
				options = this.getCurrentOptions( keys );
					//rebuild 
				this.rebuild( options );	
			},
			getInnerHTML:function( index ){
				//this function will check this.settings.dotInnerHTML property
				//if it is string function will return it's value directly
				//if  it is a function this function will call that function as a callBack method
				//ant will pass index argument to it.
				
				var inner = this.settings.dotInnerHTML;
				
				if(typeof inner === "string"){
					return inner;
				}
				
				if(typeof inner === "function"){
					return inner( index );
				}
				
				// for all other probability
				
				return "";
			},
			
			

		});
		
		
		function UTIL(){
			
		
		}
		$.extend(UTIL.prototype,{
			init:function(){

			},
			isObject:function(obj) {
			  return obj === Object(obj);
			},
			getViewPort:function(){
				if ('innerWidth' in window) {
					return window.innerWidth;
				} else {
					return document.documentElement.clientWidth;
				}
			},
			createNode:function(tag, attr, style, inner){
				//it is create HTML node with given properties and returns it
				//tag === tag name
				//attr === object that holds attribute name and value
				//style === object that holds style name and value
				//inner === innerHTML for node
				
				var k,
					node;
				
				attr = attr || {};
				style = style || {};
				inner = inner || "";
				
				//create node
				node = document.createElement( tag );
				
				//add attributes
				for(k in attr){
					if(attr.hasOwnProperty(k)){
						node.setAttribute(k, attr[k]);
					}	
				}
				
				k = null;
				
				//add styles
				for(k in style){
					if(style.hasOwnProperty(k)){
						node.style[k] = style[k];
					}	
				}
				
				node.innerHTML = inner;
				
				return node;

			},
			getValueAndType:function( value ){
				//value === string || number that could be as % or px
				//function returns number as represent value and string for value type
				var reg = /^-?\s*\d+%/i,
					type = "px";
					
				//check type is % all others will be threted as px
				if( typeof value === "string" &&  value.match( reg ) ){
					type = "%";
				}

				return [ parseInt(value,10), type ];
			},
			getNodeDimensions:function( node ){
				var dim,
					ie;//this for ie 8 support
				
				dim = node.getBoundingClientRect();
				
				ie = {
					top: dim.top,
					left: dim.left,
					width: dim.width,
					height: dim.height
				};
				
				if(typeof dim.width === "undefined"){
					ie.width = node.offsetWidth;
					ie.height = node.offsetHeight;
				}
				
				return ie;
			},

		});
		_util = (function(){
			return new UTIL();
		})();
		

		$.fn[ _pluginName ] = function( type, options ){
			var lastPlugin,//birden fazla node var ise her biri için plugin yaratıldıktan sonra
			//son yaratılan plugin return değeri olarak döndürülür.
				saved,//if there is object in node.data this will hold it
				len = 0;
			
			//parametre kontrol
			
			type = typeof type !== "string" ? "line" : type;
			
			options = options || {};
			


			this.each(function(){
				//create new plugin
				lastPlugin = new PLUGIN( this, type, options );
				
				//if there is no existing object
				if(!$.data( this , "plugin_" + _pluginName )){

					$.data( this , "plugin_" + _pluginName, {
							0:lastPlugin,
							length:1
						});
					
				}
				//if there is an object
				else{
					//get existing object
					saved = $.data( this , "plugin_" + _pluginName );
					len = saved.length;
					
					saved.length +=1;
					
					lastPlugin.id = len;
					
					//add lastPlugin to exisisting object
					saved[len] = lastPlugin;
					
					//alter the node data with new object
					$.data( this , "plugin_" + _pluginName ,saved );
					
				}
			});
			
			saved = null;
			options = null;
			
			return lastPlugin;
			
		};
		
		
	
	
	
	
})(jQuery, window, document);

/*BROSWER SUPPORT*/
//1.12.4 jQuery
//_util.getNodeDimensions()
//firefox 3.5     safari 4.0   ie8    // android 2.0 ie mobile 6.0 
