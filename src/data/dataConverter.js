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

const linesData = dataJson.subways.l
var links = [];
let stations = []
let labels = []
let linePath = {}
let transfers = []

_.forEach(linesData, (lineData, lineIndex) => {
    const lineNumber = extractLineNumber(lineData.l_xmlattr.lb)
    const validstationDatas = _.filter(lineData.p, stationData => {
        return !_.isEmpty(stationData.p_xmlattr.sid)
    })
    if (_.isUndefined(linePath[lineNumber])) {
        linePath[lineNumber] = ''
    }
    _.forEach(validstationDatas, (stationData, stationIndex) => {
        const x = _.round((stationData.p_xmlattr.x + 2000) / 1.2, 2)
        const y = _.round((stationData.p_xmlattr.y + 2000) / 1.6, 2)
        const statid = lineNumber + '-' + stationIndex
        const isTransferStation = stationData.p_xmlattr.ln.split(',').length > 1    
        
        console.log(lineNumber, stationData.p_xmlattr.sid)
        if (isTransferStation) {
            const transfer = {
                x: x - 8 + '',
                y: y - 8 + '',
                "data-id": stationData.p_xmlattr.sid,
                statid: statid
            }
            transfers.push(transfer)
        } else {
            const station = {
                name: stationData.p_xmlattr.sid,
                cx: x + '',
                cy: y + '',
                stroke: LINE_COLOR[lineNumber],
                id: stationData.p_xmlattr.sid,
                statid: statid
            }
            stations.push(station)
        }

        if (stationIndex == 0) {
            linePath[lineNumber] += 'M' + x + ',' + y
        } else {
            linePath[lineNumber] += ' L' + x + ',' + y
        }

        const label = {
            x: x + 10 + '',
            y: y - 10 + '',
            text: stationData.p_xmlattr.sid,
        }
        labels.push(label)
    })
})

stations = _.uniqBy(stations, 'name')
fs.writeFile('stations.json', JSON.stringify(stations, null, 2), function(err, data){
    if (err) console.log(err);
    console.log("=> Successfully Written to statons.json");
});

fs.writeFile('labels.json', JSON.stringify(labels, null, 2), function(err, data){
    if (err) console.log(err);
    console.log("=> Successfully Written to labels.json");
});

fs.writeFile('linePath.json', JSON.stringify(linePath, null, 2), function(err, data){
    if (err) console.log(err);
    console.log("=> Successfully Written to linePath.json");
});

fs.writeFile('transfers.json', JSON.stringify(transfers, null, 2), function(err, data){
    if (err) console.log(err);
    console.log("=> Successfully Written to transfers.json");
});