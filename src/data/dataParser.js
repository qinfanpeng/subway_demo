const dataJson = require('./dataFromBaiduMap.json')
const _ = require('lodash')
var fs = require('fs');
var util = require('util')

const LINE_COLOR = {
    1: '#EE1822',
    2: '#85C73F',
    3: '#FDD303',
    4: '#4E2C8D',
    5: '#8F57A2',
    6: '#D7156B',
    7: '#F26F1F',
    8: '#009DD7',
    9: '#67CCF6',
    10: '#B8A8CF',
    11: '#7C1F31',
    12: '#54ae11',
    13: '#E77DAD',
    16: '#78d6cd',
    17: '#bc796f'
}

const extractLineNumber = lnStr => parseInt(lnStr.match(/[0-9]+/)[0])
const getOptimizedX = stationData => _.round((stationData.p_xmlattr.x + 2000) / 1.2, 2)
const getOptimizedY = stationData => _.round((stationData.p_xmlattr.y + 2000) / 1.6, 2)

const linesData = dataJson.subways.l

const parseNonTransferStations = () => {
    return _.flatMap(linesData, lineData => {
        const lineNumber = extractLineNumber(lineData.l_xmlattr.lb)
        const validNonTransferStationDatas = _.filter(lineData.p, stationData => {
            const isTransferStation = stationData.p_xmlattr.ln.split(',').length > 1    
            return !_.isEmpty(stationData.p_xmlattr.sid) && !isTransferStation
        })
        return _.map(validNonTransferStationDatas, (stationData, stationIndex) => {
            const statid = 'non-transfer-' + lineNumber + '-' + stationIndex
            
            return {
                name: stationData.p_xmlattr.sid,
                cx: getOptimizedX(stationData) + '',
                cy: getOptimizedY(stationData) + '',
                stroke: LINE_COLOR[lineNumber],
                id: stationData.p_xmlattr.sid,
                statid: statid
            }
        })
    })
}

const parseTransferStations = () => {
    return _.flatMap(linesData, (lineData, lineIndex) => {
        const lineNumber = extractLineNumber(lineData.l_xmlattr.lb)
        const validTransferStationDatas = _.filter(lineData.p, stationData => {
            const isTransferStation = stationData.p_xmlattr.ln.split(',').length > 1    
            return !_.isEmpty(stationData.p_xmlattr.sid) && isTransferStation
        })
        return _.map(validTransferStationDatas, (stationData, stationIndex) => {
            const statid = 'transfer-' + lineNumber + '-' + stationIndex
            
            return {
                x: getOptimizedX(stationData) - 8 + '',
                y: getOptimizedY(stationData) - 8 + '',
                "data-id": stationData.p_xmlattr.sid,
                statid: statid
            }
        })
    })
}

const parseLabels = () => {
    return _.flatMap(linesData, lineData => {
        const validStationDatas = _.filter(lineData.p, stationData => {
            return !_.isEmpty(stationData.p_xmlattr.sid)
        })
        return _.map(validStationDatas, stationData => {
            return {
                x: getOptimizedX(stationData) + 5 + '',
                y: getOptimizedY(stationData) - 10 + '',
                text: stationData.p_xmlattr.sid,
            }
        })
    })
}

const parseLinePaths = () => {
    let linePath = {}
    _.forEach(linesData, lineData => {
        const lineNumber = extractLineNumber(lineData.l_xmlattr.lb)
        const isLoopLine = lineData.l_xmlattr.loop
        const validstationDatas = _.filter(lineData.p, stationData => {
            return !_.isEmpty(stationData.p_xmlattr.sid)
        })
        if (_.isUndefined(linePath[lineNumber])) {
            linePath[lineNumber] = ''
        }
        let firstStationInfo = {}
        _.forEach(validstationDatas, (stationData, stationIndex) => {
            const x = getOptimizedX(stationData)
            const y = getOptimizedY(stationData)
            const isFirstStation = stationIndex == 0
            const isLastStation = stationIndex == validstationDatas.length - 1
        
            if (isFirstStation) {
                linePath[lineNumber] += 'M' + x + ',' + y
                firstStationInfo = { x, y }
            } else {
                linePath[lineNumber] += ' L' + x + ',' + y
            }
            if (isLoopLine && isLastStation) {
                linePath[lineNumber] += ' L' + firstStationInfo.x + ',' + firstStationInfo.y + ' Z'
            }
        })
    })
    return linePath
}

let stations = parseNonTransferStations()
stations = _.uniqBy(stations, 'name')
fs.writeFile('stations.json', JSON.stringify(stations, null, 2), function(err, data){
    if (err) console.log(err);
    console.log("=> Successfully Written to statons.json");
});

let labels = parseLabels()
fs.writeFile('labels.json', JSON.stringify(labels, null, 2), function(err, data){
    if (err) console.log(err);
    console.log("=> Successfully Written to labels.json");
});

const linePath = parseLinePaths()
fs.writeFile('linePath.json', JSON.stringify(linePath, null, 2), function(err, data){
    if (err) console.log(err);
    console.log("=> Successfully Written to linePath.json");
});

let transfers = parseTransferStations()
fs.writeFile('transfers.json', JSON.stringify(transfers, null, 2), function(err, data){
    if (err) console.log(err);
    console.log("=> Successfully Written to transfers.json");
});