define(["dom","playbackManager","connectionManager","events","mediaInfo","layoutManager","globalize","itemHelper","css!./upnextdialog","emby-button","flexStyles"],function(dom,playbackManager,connectionManager,events,mediaInfo,layoutManager,globalize,itemHelper){"use strict";function seriesImageUrl(item,options){if("Episode"!==item.Type)return null;if(options=options||{},options.type=options.type||"Primary","Primary"===options.type&&item.SeriesPrimaryImageTag)return options.tag=item.SeriesPrimaryImageTag,connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId,options);if("Thumb"===options.type){if(item.SeriesThumbImageTag)return options.tag=item.SeriesThumbImageTag,connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId,options);if(item.ParentThumbImageTag)return options.tag=item.ParentThumbImageTag,connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.ParentThumbItemId,options)}return null}function imageUrl(item,options){return options=options||{},options.type=options.type||"Primary",item.ImageTags&&item.ImageTags[options.type]?(options.tag=item.ImageTags[options.type],connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.PrimaryImageItemId||item.Id,options)):"Primary"===options.type&&item.AlbumId&&item.AlbumPrimaryImageTag?(options.tag=item.AlbumPrimaryImageTag,connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.AlbumId,options)):null}function setPoster(osdPoster,item,secondaryItem){if(item){var imgUrl=seriesImageUrl(item,{type:"Primary"})||seriesImageUrl(item,{type:"Thumb"})||imageUrl(item,{type:"Primary"});if(!imgUrl&&secondaryItem&&(imgUrl=seriesImageUrl(secondaryItem,{type:"Primary"})||seriesImageUrl(secondaryItem,{type:"Thumb"})||imageUrl(secondaryItem,{type:"Primary"})),imgUrl)return void(osdPoster.innerHTML='<img class="upNextDialog-poster-img" src="'+imgUrl+'" />')}osdPoster.innerHTML=""}function getHtml(){var html="";return html+='<div class="upNextDialog-poster">',html+="</div>",html+='<div class="flex flex-direction-column flex-grow">',html+='<h2 class="upNextDialog-nextVideoText" style="margin:.25em 0;">&nbsp;</h2>',html+='<h3 class="upNextDialog-title" style="margin:.25em 0 .5em;"></h3>',html+='<div class="flex flex-direction-row upNextDialog-mediainfo">',html+="</div>",html+='<div class="upNextDialog-overview" style="margin-top:1em;"></div>',html+='<div class="flex flex-direction-row upNextDialog-buttons" style="margin-top:1em;">',html+='<button type="button" is="emby-button" class="raised raised-mini btnStartNow">',html+=globalize.translate("sharedcomponents#HeaderStartNow"),html+="</button>",html+='<button type="button" is="emby-button" class="raised raised-mini btnHide">',html+=globalize.translate("sharedcomponents#Hide"),html+="</button>",html+="</div>",html+="</div>"}function setNextVideoText(){var instance=this,hideTime=instance._hideTime;if(hideTime){var elem=instance.options.parent,secondsRemaining=Math.max(Math.round((hideTime-(new Date).getTime())/1e3),0),timeText='<span class="upNextDialog-countdownText">'+globalize.translate("sharedcomponents#HeaderSecondsValue",secondsRemaining)+"</span>",nextVideoText="Episode"===instance.itemType?globalize.translate("sharedcomponents#HeaderNextEpisodePlayingInValue",timeText):globalize.translate("sharedcomponents#HeaderNextVideoPlayingInValue",timeText);elem.querySelector(".upNextDialog-nextVideoText").innerHTML=nextVideoText}}function fillItem(item){var instance=this,elem=instance.options.parent;setPoster(elem.querySelector(".upNextDialog-poster"),item),elem.querySelector(".upNextDialog-overview").innerHTML=item.Overview||"",elem.querySelector(".upNextDialog-mediainfo").innerHTML=mediaInfo.getPrimaryMediaInfoHtml(item,{});var title=itemHelper.getDisplayName(item);item.SeriesName&&(title=item.SeriesName+" - "+title),elem.querySelector(".upNextDialog-title").innerHTML=title||"",instance.itemType=item.Type,instance.show()}function clearCountdownTextTimeout(instance){instance._countdownTextTimeout&&(clearTimeout(instance._countdownTextTimeout),instance._countdownTextTimeout=null)}function startCountdownTextTimeout(instance){setNextVideoText.call(instance),clearCountdownTextTimeout(instance),instance._countdownTextTimeout=setInterval(setNextVideoText.bind(instance),500)}function onStartNowClick(){this._playNextOnHide=!0,hideComingUpNext.call(this)}function init(instance,options){options.parent.innerHTML=getHtml(),options.parent.classList.add("upNextDialog"),options.parent.classList.add("upNextDialog-hidden"),playbackManager.nextItem(options.player).then(fillItem.bind(instance)),options.parent.querySelector(".btnHide").addEventListener("click",instance.hide.bind(instance)),options.parent.querySelector(".btnStartNow").addEventListener("click",onStartNowClick.bind(instance))}function onHideAnimationComplete(e){var instance=this,elem=e.target;elem.classList.add("hide"),clearHideAnimationEventListeners(instance,elem),events.trigger(instance,"hide"),instance._playNextOnHide!==!1&&advanceFromUpNext(instance)}function clearHideAnimationEventListeners(instance,elem){var fn=instance._onHideAnimationComplete;fn&&dom.removeEventListener(elem,transitionEndEventName,fn,{once:!0})}function hideComingUpNext(){var instance=this;stopComingUpNextHideTimer(instance),clearCountdownTextTimeout(this);var elem=instance.options.parent;clearHideAnimationEventListeners(this,elem),void elem.offsetWidth,elem.classList.add("upNextDialog-hidden");var fn=onHideAnimationComplete.bind(instance);instance._onHideAnimationComplete=fn,dom.addEventListener(elem,transitionEndEventName,fn,{once:!0})}function advanceFromUpNext(instance){var options=instance.options,endTimeMs=options.endTimeMs;(new Date).getTime()+1e3>=endTimeMs||options&&instance._playNextOnHide!==!1&&playbackManager.nextTrack(options.player)}function startComingUpNextHideTimer(instance){stopComingUpNextHideTimer(instance),instance._playNextOnHide=!0;var timeoutLength=instance.options.countdownMs;instance._hideTime=(new Date).getTime()+timeoutLength,startCountdownTextTimeout(instance),instance._comimgUpNextHideTimeout=setTimeout(hideComingUpNext.bind(instance),timeoutLength)}function stopComingUpNextHideTimer(instance){instance._comimgUpNextHideTimeout&&(clearTimeout(instance._comimgUpNextHideTimeout),instance._comimgUpNextHideTimeout=null)}function UpNextDialog(options){this.options=options,init(this,options)}var transitionEndEventName=dom.whichTransitionEvent();return UpNextDialog.prototype.show=function(){var elem=this.options.parent;clearHideAnimationEventListeners(this,elem),elem.classList.remove("hide"),void elem.offsetWidth,elem.classList.remove("upNextDialog-hidden"),layoutManager.tv&&setTimeout(function(){focusManager.focus(elem.querySelector(".btnStartNow"))},50),startComingUpNextHideTimer(this)},UpNextDialog.prototype.hide=function(){this._playNextOnHide=!1,hideComingUpNext.call(this)},UpNextDialog.prototype.reset=function(){this._playNextOnHide=!1,hideComingUpNext.call(this)},UpNextDialog.prototype.destroy=function(){this._playNextOnHide=null,this.reset(),this.options=null,this.itemType=null,this._hideTime=null},UpNextDialog});