// === ajax-utils.js ===
(function (global) {
  const ajaxUtils = {};

  function getRequestObject() {
    if (global.XMLHttpRequest) {
      return new XMLHttpRequest();
    } else {
      global.alert("Error");
      return null;
    }
  }

  ajaxUtils.sendGetRequest = function (
    requestUrl,
    responseHandler,
    isJsonResponse
  ) {
    let request = getRequestObject();
    request.onreadystatechange = function () {
      handleResponse(request, responseHandler, isJsonResponse);
    };
    request.open("GET", requestUrl, true);
    request.send(null);
  };

  ajaxUtils.sendPostRequest = function (
    requestUrl,
    requestBody,
    responseHandler,
    isJsonResponse
  ) {
    let request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      handleResponse(request, responseHandler, isJsonResponse);
    };
    request.open("POST", "http://localhost:3000" + requestUrl, true); // ЗМІНЕНО
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    request.send(JSON.stringify(requestBody));
  };


  function handleResponse(request, responseHandler, isJsonResponse) {
  if (request.readyState == 4) {
    if (request.status == 200) {
      if (isJsonResponse == undefined) {
        isJsonResponse = true;
      }
      if (isJsonResponse) {
        responseHandler(JSON.parse(request.responseText));
      } else {
        responseHandler(request.responseText);
      }
    } else {
      console.error("❌ Помилка запиту:", request.status, request.responseText);
    }
  }
}

  global.$ajaxUtils = ajaxUtils;
})(window);
