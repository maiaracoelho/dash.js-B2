﻿/** Algoritmo com característica de adaptação conservativa, implementado a partir da Dissertação de Romero
 * 	@class RomeroMeanRule
 */

MediaPlayer.rules.RomeroMeanRule = function () {
    "use strict";
    var insertThroughputs = function (throughList, availableRepresentations) {
		var self = this, representation, bandwidth, quality, downloadTime, through;
		
		for(var i = 0; i < throughList.length; i++){
			if(throughList[i].bandwidth == null || throughList[i].bandwidth == 0){
				quality = throughList[i].quality;
				representation = availableRepresentations[quality];
				bandwidth = self.metricsExt.getBandwidthForRepresentation(representation.id);
				bandwidth /= 1000; //bit/ms
				
				downloadTime = throughList[i].finishTime.getTime() - throughList[i].responseTime.getTime();
				
				through = throughList[i].sizeSeg/downloadTime;  //o único corrigido aqui pq é o unico que utiliza o throughs anteriores para a escolha atual
				
				self.debug.log("bandwidth: " + bandwidth);
				self.debug.log("throughList[i].sizeSeg: " +  throughList[i].sizeSeg);
				self.debug.log("downloadTime: " + downloadTime);
				self.debug.log("through: " + through);
				
	    		self.metricsBaselinesModel.updateThroughputSeg(throughList[i], bandwidth, through);
			}
		}
    };
    
    return {
        debug: undefined,
        manifestExt: undefined,
        metricsExt: undefined,
        metricsBaselineExt: undefined,
        metricsBaselinesModel: undefined,
        /**
         * @param {current} current - Índice da representação corrente
         * @param {metrics} metrics - Metricas armazenadas em MetricsList
         * @param {data} data - Dados de audio ou vídeo
         * @memberof RomeroMeanRule#
         */
        checkIndex: function (current, metrics, data, metricsBaseline, availableRepresentations) {

            var self = this,
            	lastRequest = self.metricsExt.getLastHttpRequest(metrics),
            	currentBuffer = self.metricsExt.getCurrentBufferLevel(metrics),
            	averageThroughput,
                deferred,
                representation1,
                representation2,
                representation3,
                currentBandwidth,
                oneUpBandwidth,
                oneDownBandwidth, 
                max,
                representationCur = current,
                numSegs = 3,															//numero de segmentos que serão calculados na media dos throughs
                SENSIVITY = 0.95,
                currentBandwidthMs = 0;

            self.debug.log("Checking download ROMERO MEAN rule...");

            if (!metrics) {
             	//self.debug.log("No metrics, bailing.");
             	return Q.when(new MediaPlayer.rules.SwitchRequest());
             }
             
            if (!metricsBaseline) {
             	//self.debug.log("No metrics Baseline, bailing.");
             	return Q.when(new MediaPlayer.rules.SwitchRequest());
             }
                        
             if (lastRequest == null) {
                 //self.debug.log("No requests made for this stream yet, bailing.");
                 return Q.when(new MediaPlayer.rules.SwitchRequest());
             }
             
             if (currentBuffer == null) {
                 //self.debug.log("No requests made for this stream yet, bailing.");
                 return Q.when(new MediaPlayer.rules.SwitchRequest());
             }

            deferred = Q.defer();
            
            insertThroughputs.call(self, metricsBaseline.ThroughSeg, availableRepresentations);
            
            max = self.manifestExt.getRepresentationCount1(data);
        	max -= 1;
        	representation2 = self.manifestExt.getRepresentationFor1(current, data);
        	currentBandwidth = self.manifestExt.getBandwidth1(representation2);
        	currentBandwidthMs = currentBandwidth/1000;
        	
        	if (metricsBaseline.ThroughSeg.length < numSegs){
        		deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));
        	}else{

               		averageThroughput = self.metricsBaselineExt.getAverageThrough3Segs(numSegs, metricsBaseline);	
               		averageThroughput = averageThroughput * SENSIVITY;
               		
    				self.debug.log("Baseline - AverageThroughput: " + averageThroughput);
    				self.debug.log("Baseline - currentBandwidthMs: " + currentBandwidthMs + "bpms");
    					     
    				if(currentBuffer.level == 0){
                        self.debug.log("Current 0");
                        current = 0;
                        deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));	
                	}else{
                		if (averageThroughput > currentBandwidthMs) {
                			if (representationCur == max){
            					self.debug.log("No change.");
        		                return Q.when(new MediaPlayer.rules.SwitchRequest(MediaPlayer.rules.SwitchRequest.prototype.NO_CHANGE));
        					}
                			while (representationCur < max){
        						representation3 = self.manifestExt.getRepresentationFor1(representationCur + 1, data);
        						oneUpBandwidth = self.manifestExt.getBandwidth1(representation3);
        						oneUpBandwidth = oneUpBandwidth/1000;

                				if (oneUpBandwidth < averageThroughput){
                					//self.debug.log("switch up.");
        							current += 1;
        						}else{
        							self.debug.log("Current1: " + current + "representationCur1: " + representationCur);
        							return Q.when(new MediaPlayer.rules.SwitchRequest(current));

        						}
        						representationCur++;
        					}
        					self.debug.log("Current11: " + current + "representationCur11: " + representationCur);
        					deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));								
        				}else{
        					if(representationCur == 0){
            					self.debug.log("No change.");
        		                return Q.when(new MediaPlayer.rules.SwitchRequest(MediaPlayer.rules.SwitchRequest.prototype.NO_CHANGE));
        					}
        					while (representationCur > 0){
        						representation1 = self.manifestExt.getRepresentationFor1(representationCur - 1, data);
        						oneDownBandwidth = self.manifestExt.getBandwidth1(representation1);
        						oneDownBandwidth = oneDownBandwidth/1000;

        						if(oneDownBandwidth > averageThroughput){
        							//self.debug.log(" switch Down.");
        							current -= 1;
        						}else{
        							self.debug.log("Current1: " + current + "representationCur1: " + representationCur);
        							return Q.when(new MediaPlayer.rules.SwitchRequest(current));
        						}
        						representationCur--;
        					}
        					self.debug.log("Current22: " + current + "representationCur22: " + representationCur);
        					deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));	
        				}
                	}
        	}
            return deferred.promise;
        }
    };
};
   
MediaPlayer.rules.RomeroMeanRule.prototype = {
    constructor: MediaPlayer.rules.RomeroMeanRule
};