/* Baseline implementations by Maiara on 2013-10-29
 * 
 */
Dash.dependencies.DashMetricsBaselineExtensions = function () {
    "use strict";
    
    var getAverageThrough3Segs = function (numSegs, metricsBaseline) {
        if (metricsBaseline == null) {
            return [];
        }
        
        var throughList = metricsBaseline.ThroughSeg,
        	throughListLength,
        	throughListIndex,
        	sumThrough = 0,
        	averageThrough = 0;
    
        if (throughList == null || throughList.length <= 0) {
            return [];
        }

        throughListLength = throughList.length;
        throughListIndex = throughListLength - 1;

        while (throughListIndex >= throughListLength - numSegs) {
        		sumThrough += throughList[throughListIndex].throughSeg;   //  bit/ms
        		throughListIndex -= 1;
        }
		
		averageThrough = sumThrough/numSegs;
    	this.debug.log("sumThrough: " + sumThrough);
    	this.debug.log("numSegs: " + numSegs);

        return averageThrough;
    }, 
    
    getThroughSegs = function (metricsBaseline) {
        if (metricsBaseline == null) {
            return [];
        }

        return !metricsBaseline.ThroughSeg ? metricsBaseline.ThroughSeg : [];
    },
    
    getAverageThrough = function (time1, throughList, startSessionTime) {
    	var begin, 
    	end = throughList.length - 1,
    	average, 
 		sumThroughs = 0, 
 		countSegs = 0,
 		startTime, 
 		startTimeTemp, 
 		finishTime;

    	for(begin = 0; begin <= end; begin++){
    		startTime = throughList[begin].responseTime.getTime() - startSessionTime; 
    		finishTime = throughList[begin].finishTime.getTime() - startSessionTime;
    		
    		if(finishTime > time1){
    			if (startTime < time1){
    				startTimeTemp = time1;
    			}else{
    				startTimeTemp = startTime;
    			}
    			sumThroughs += throughList[begin].throughSeg;
    			
    			countSegs++;
    		}
    	}
    	
    	average = sumThroughs/countSegs;
    	
    	this.debug.log("Baseline - average: "+ countSegs);
    	this.debug.log("Baseline - average: "+ average);

    	return average;
        
    };

    return {
    	debug : undefined,
    	getAverageThrough3Segs : getAverageThrough3Segs,
    	getAverageThrough : getAverageThrough
    };
};

Dash.dependencies.DashMetricsBaselineExtensions.prototype = {
    constructor: Dash.dependencies.DashMetricsBaselineExtensions
};
