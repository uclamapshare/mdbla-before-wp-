import json
import arcpy, urllib, urllib2, json, os
import csv


inputFile = r'W:\IOES_Data\PIER_Data\Utilities\Fall2015CPUC_Data\geocoding\sce\street_res\input\inputSCE.csv'

def callEsriApi(address):
    url = "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?text=" + address + "&f=pjson"
    response = urllib.urlopen(url)
    data = json.loads(response.read())
    if(len(data["locations"]) > 0):
        # matched addressed
        addressMatched =  data["locations"][0]["name"]

        #getting the lat/lngs of the matched addressed
        addressLat = data["locations"][0]["feature"]["geometry"]["y"]
        addressLng = data["locations"][0]["feature"]["geometry"]["x"]

        #getting the Score of the matched addressed
        matchedAddressScore = data["locations"][0]["feature"]["attributes"]["Score"]

        return addressMatched, addressLat, addressLng, matchedAddressScore
    else:
        addressMatched = 'none'
        addressLat = 0
        addressLng = 0
        return addressMatched, addressLat, addressLng, matchedAddressScore


def getAddress():
    rownum = 0
    with open(r'W:\IOES_Data\PIER_Data\Utilities\Fall2015CPUC_Data\geocoding\sce\street_res\input\resultFromInputSCE.csv', 'w') as csvfile:
        # headers
        fieldnames = ['account_id','iou','addressMatched', 'lat','lon','score']
        writer = csv.DictWriter(csvfile, delimiter=',', lineterminator='\n', fieldnames=fieldnames)
        writer.writerow({'account_id':'account_id','iou':'iou','addressMatched':'addressMatched','lat': 'lat','lon': 'lon','score': 'score' })
        with open (inputFile, 'rb') as csvFile:
            reader = csv.DictReader(csvFile)
            for row in reader:
                try:
                    if rownum == 0:
                        hearder = row;
                    else:
                         address = row['address'] + ',' + row['city'] + ',' + row['state'] + ',' + row['zip']
                         account_id = row['account_id']
                         result = callEsriApi(address)
                         addressMatched =result[0]
                         addressLat = result[1]
                         addressLng = result[2]
                         matchedAddressScore = result[3]
                         writer.writerow({'account_id':account_id, 'iou': 'SCE','addressMatched':addressMatched,'lat': addressLat,'lon': addressLng,'score': matchedAddressScore })
                    rownum +=1
                    print rownum
                except Exception as e:
                    rownum +=1
                    print e
                    print rownum
                    continue


def main():
    getAddress()

if __name__ == "__main__":
    main()
