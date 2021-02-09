//  Bluefox Fetch API Base URL
//  https://apollo-psq.bluefoxengage.com/third_party_fetch_api/v100/ (Americas) https://artemis-psq.bluefoxengage.com/third_party_fetch_api/v100/ (Europe & Asia)
let serverApiBaseUrl =
  "https://apollo-psq.bluefoxengage.com/third_party_fetch_api/v100/";

//  Fetch API tokens (Access and Secret) are available for each sensor in the BlueFox Count Platform Dashboard
//  https://apollo-psq.bluefoxengage.com/login (Americas) https://artemis-psq.bluefoxengage.com/login (Europe & Asia)
let sensors = [
  {
    access_token: "ACCESS-1B2973A9-FBBE-4892-980B-A7AEF8XXXXXX",
    secret_token: "SECRET-2986C69A-09D3-4351-BEDD-3C5B60XXXXXX",
    name: "Location Name",
    max_count: 1,
  },
  {
    access_token: "ACCESS-0207E12A-1FFC-41C3-8F18-287898XXXXXX",
    secret_token: "SECRET-638ADBCD-759D-487D-9E9E-24FEDDXXXXXX",
    name: "Location Name",
    max_count: 1,
  },
  {
    access_token: "ACCESS-B02F4682-A289-4C03-9CE9-366921XXXXXX",
    secret_token: "SECRET-F8245E47-50A1-4F5D-98A2-BC7787XXXXXX",
    name: "Location Name",
    max_count: 1,
  },
  {
    access_token: "ACCESS-C0BCD8A6-0824-4FEA-AA9D-663C6BXXXXXX",
    secret_token: "SECRET-9472ACBD-A684-426E-AFDD-246A2EXXXXXX",
    name: "Location Name",
    max_count: 1,
  },
];

// Sets the update interval for retrieval of realtime count data. Our cloud platform collects count data every 20 seconds from active sensors.
let updateInterval = 60000; // In milliseconds. Default: 1 minute

//  On load function.
$(function () {
  for (i = 0; i < sensors.length; i++) {
    //  Retrieves each sensor's location name and max occupancy value
    //  By disabling this call, location name and max occupancy value can be set manually in the sensor object
    getLocationInfo(i);
  }
  setTimeout(function () {
    for (i = 0; i < sensors.length; i++) {
      //  Retrieves each sensor's realtime occupancy count
      getRealtimeCount(i);
      //  Updates the sensor location name and max occupancy value according at the set interval
      //  By disabling this call, the location name and max occupancy value can be set manually in the sensor object
      setInterval(getLocationInfo, updateInterval, i);
      //  Updates the realtime occupancy count according to the set interval
      setInterval(getRealtimeCount, updateInterval, i);
    }
    // Removes the loadscreen on load
    $("#loading-screen").fadeOut(500);
  }, 1500);
});

//  ForEach Iterator
var forEach = function (array, callback, scope) {
  for (var i = 0; i < array.length; i++) {
    callback.call(scope, i, array[i]);
  }
};

function redrawCountGauges(sensorIndex, count) {
  //  Radial gauge offset (-219.99078369140625)
  var gaugeOffset = -219.99078369140625;
  forEach(
    document.querySelectorAll(".location-" + sensorIndex),
    function (index, value) {
      //  If the current occupancy count is above or equal to the max occupancy value
      if (count >= sensors[sensorIndex].max_count) {
        //  Sets the gauge fill percentage to full
        value
          .querySelector(".fill")
          .setAttribute("style", "stroke-dashoffset: " + 0);
        //  Sets the gauge color to red
        value.querySelector(".fill").style.stroke = "#FA5E3E";
      }
      //  If the current occupancy count is above half of the max occupancy value
      else if (count >= sensors[sensorIndex].max_count / 2) {
        //  Sets the gauge fill percentage
        value
          .querySelector(".fill")
          .setAttribute(
            "style",
            "stroke-dashoffset: " +
              ((sensors[sensorIndex].max_count - count) /
                sensors[sensorIndex].max_count) *
                gaugeOffset
          );
        //  Sets the gauge color to yellow
        value.querySelector(".fill").style.stroke = "#F29100";
      }
      //  If the current occupancy count is below half the max occupancy value
      else {
        //  Sets the gauge fill percentage
        value
          .querySelector(".fill")
          .setAttribute(
            "style",
            "stroke-dashoffset: " +
              ((sensors[sensorIndex].max_count - count) /
                sensors[sensorIndex].max_count) *
                gaugeOffset
          );
        //  Sets the gauge color to green
        value.querySelector(".fill").style.stroke = "#56BF6B";
      }
      //  Sets the current real-time count text
      value.querySelector(".count-value").innerHTML = count;
      //  Sets the sensor location name
      value.querySelector(".location-name").innerHTML =
        sensors[sensorIndex].name;
      //  Sets the max occupancy value "Limit"
      value.querySelector(".limit-text").innerHTML =
        "Limit " + sensors[sensorIndex].max_count;
    }
  );
}

//  Returns the realtime occupancy count for a specified sensor location.
var getRealtimeCount = function (sensorIndex) {
  $.ajax({
    // Request
    url: serverApiBaseUrl + "get_location_realtime_occupancy_count",
    data: "{}",
    type: "POST",
    // Request header with authentication tokens
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Content-Type", "application/plain");
      xhr.setRequestHeader(
        "x-api-access-token",
        sensors[sensorIndex].access_token
      );
      xhr.setRequestHeader(
        "x-api-secret-token",
        sensors[sensorIndex].secret_token
      );
    },
    success: function (response) {
      if (
        //  Floor occupancy count is used to offset devices in the count which are always detected
        response.occupancy_count_flooring_enabled &&
        response["occupancy_count"] - response["floor_occupancy_count"] > 0
      ) {
        redrawCountGauges(
          sensorIndex,
          response["occupancy_count"] - response["floor_occupancy_count"]
        );
      } else if (response["occupancy_count"] > 0) {
        redrawCountGauges(sensorIndex, response["occupancy_count"]);
      } else {
        redrawCountGauges(sensorIndex, 0);
      }
    },
  });
};

//  Returns general information about a specified sensor location.
var getLocationInfo = function (sensorIndex) {
  $.ajax({
    //  Request
    url: serverApiBaseUrl + "get_location_info",
    data: "{}",
    type: "POST",
    //  Request header with authentication tokens
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Content-Type", "application/plain");
      xhr.setRequestHeader(
        "x-api-access-token",
        sensors[sensorIndex].access_token
      );
      xhr.setRequestHeader(
        "x-api-secret-token",
        sensors[sensorIndex].secret_token
      );
    },
    success: function (response) {
      if (response.status == "TOKEN_AUTHENTICATION_ERROR") {
		var alerted = localStorage.getItem('alerted') || '';
		if (alerted != 'yes') {
		 alert("Enable Fetch API access for your sensors and add their authentication tokens (Access and Secret) to the sensors object in main.js");
		 localStorage.setItem('alerted','yes');
		}
      } else {
        //  By disabling this call, the max occupancy value can be set manually in the sensor object
        sensors[sensorIndex].max_count =
          response.location_info.max_occupancy_count;
        //  By disabling this call, the location name value can be set manually in the sensor object
        sensors[sensorIndex].name = response.location_info.nickname;
      }
      //  Other response examples
      //  response.location_info.location_uuid;
      //  response.location_info.timezone_name;
      //  response.location_info.occupancy_count_flooring_enabled;
      //  response.location_info.floor_occupancy_count;
      //  response.location_info.occupancy_count_alert_enabled;
      //  response.location_info.sensor_last_connected_at;
      //  response.location_info.subscription_valid_until;
    },
  });
};
