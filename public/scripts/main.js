/* eslint-disable */
function assignClicks() {
  $('.job-row').each(function(index, element) {
    $(element).find('#pause-button').on("click", function() {
      console.log(this);
      var jobId = $(this).data('id');
      console.log(jobId);

      $.ajax({
        type: "POST",
        url: "/jobs/pause",
        data: JSON.stringify({ id: jobId }),
        dataType: "json",
        contentType: "application/json",
        beforeSend: function() { $(this).addClass("is-loading"); $('#error-message-2').text(""); },
        complete: function() { $(this).removeClass("is-loading"); getJobStatus(); },
        error: function(error) { 
          console.log(error);
          $('#error-message-2').addClass("is-danger");
          $("#error-message-2").text("Could not fetch results.");
        }
      });
    });

    $(element).find('#resume-button').on("click", function() {
      console.log(this);
      var jobId = $(this).data('id');
      console.log(jobId);
      $.ajax({
        type: "POST",
        url: "/jobs/resume",
        data: JSON.stringify({ id: `${jobId}` }),
        dataType: "json",
        contentType: "application/json",
        beforeSend: function() { $(this).addClass("is-loading"); $('#error-message-2').text(""); },
        complete: function() { $(this).removeClass("is-loading"); getJobStatus(); },
        error: function(error) { 
          console.log(error);
          $('#error-message-2').addClass("is-danger");
          $("#error-message-2").text("Could not fetch results.");
        }
      });
    });

    $(element).find('#terminate-button').on("click", function() {
      var jobId = $(this).data('id');
      console.log(jobId);
      $.ajax({
        type: "POST",
        url: "/jobs/terminate",
        data: JSON.stringify({ id: `${jobId}` }),
        dataType: "json",
        contentType: "application/json",
        beforeSend: function() { $(this).addClass("is-loading"); $('#error-message-2').text(""); },
        complete: function() { $(this).removeClass("is-loading"); getJobStatus(); },
        error: function(error) { 
          console.log(error);
          $('#error-message-2').addClass("is-danger");
          $("#error-message-2").text("Could not fetch results.");
        }
      });
    });
  });
}

function showJobStatus(data, status, xhr) {
  $('.table > .table-body').html("");
  $.each(data, function(i, element)  {
    $('.table > .table-body').append(
      `<tr class="job-row">
        <th>${i+1}</th>
        <td>Job ${element.jobId}</td>
        <td>${element.status}</td>
        <td><button id="pause-button" class="button is-warning" data-id=${element.jobId}>Pause</button></td>
        <td><button id="resume-button" class="button is-success" data-id=${element.jobId}>Resume</button></td>
        <td><button id="terminate-button" class="button is-danger" data-id=${element.jobId}>Terminate</button></td>
      </tr>`
    );
  });
  assignClicks();
}

function getJobStatus() {
  $.get({
    url: "/jobs/all",
    beforeSend: function() { $('#refreshButton').addClass("is-loading"); $('#error-message').text(""); },
    success: showJobStatus,
    complete: function() { $('#refreshButton').removeClass("is-loading"); },
    error: function(error) { 
      console.log(error);
      $('#error-message').addClass("is-danger");
      $("#error-message").text("Could not fetch results.");
    }
  });
}

$(window).on("load", getJobStatus);
$('#refreshButton').on("click", getJobStatus);
$('#createButton').click(function() {
  $.post({
    url: "/jobs/create",
    beforeSend: function() { $('#createButton').addClass("is-loading"); },
    success: function(data) { $('#createMessage').text(data); },
    complete: function() { $('#createButton').removeClass("is-loading"); getJobStatus(); },
    error: function(error)  {
      console.log(error);
      $('#error-message').addClass("is-danger");
      $("#error-message").text("Could not fetch results.");
    }
  });
});