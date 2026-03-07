function load_dashboard_data()
{
    $.ajax({
        "url": "api.php",
        "type": "POST",
        "data": "action=dashboard_data",
        "success": function(data) {
            try { data = JSON.parse(data); }catch(err){}
            if(data.status == "success")
            {
                $("#mac_url").val(data.data.stalker_base.server_url);
                $("#mac_id").val(data.data.stalker_base.mac_id);
                $("#mac_serial").val(data.data.stalker_base.serial);
                $("#mac_dv1").val(data.data.stalker_base.device_id1);
                $("#mac_dv2").val(data.data.stalker_base.device_id2);
                $("#mac_sig").val(data.data.stalker_base.signature);
                $(".mac_tv_expiry").text(data.data.stalker_data.expiry);
                $(".mac_tv_count").text(data.data.stalker_data.channels_count);
                $(".mac_stream_proxy_status").text(data.data.settings.stream_proxy);
                if(data.data.stalker_base.server_url !== "" && data.data.stalker_base.server_url !== null && data.data.stalker_base.server_url !== undefined) {
                    $("#box_stalker_details").fadeIn();
                    $("#btn_delete_mac").fadeIn();
                }
                $("#btn_toggle_proxy_status").fadeIn();
                
            }
        },
        "error": function(data)
        {
            Swal.fire({title: "Oops",text: "Server or Network Failed",icon: "error"});
        }
    });
}

$("#btn_nadminLogout").on("click", function(){
    logout_admin(); 
});

function logout_admin()
{
    $.ajax({
        "url": "api.php",
        "type": "POST",
        "data": "action=logout",
        "success": function(data) {
            location.reload();
        },
        "error": function(data)
        {
            location.reload();
        }
    });
}
$("#txt_nadminPIN").keyup(function(event){
    if(event.keyCode === 13){
        changeAccessPIN();
    }
});
$("#btn_nadminPIN").on("click", function(){
    changeAccessPIN();
});
function changeAccessPIN()
{
    $("#btn_nadminPIN").attr("disabled", "");
    let new_pin = $("#txt_nadminPIN").val();
    $.ajax({
        "url": "api.php",
        "type": "POST",
        "data": "action=change_access_pin&pin=" + new_pin,
        "success": function(data) {
            try { data = JSON.parse(data); }catch(err){}
            if(data.status == "success")
            {
                logout_admin();
                Swal.fire({title: "OK",text: data.message,icon: "success"});
            }
            else
            {
                if(data.status == "error")
                {
                    Swal.fire({title: "Oops",text: data.message,icon: "warning"});
                }
                else
                {
                    Swal.fire({title: "Oops",text: "Unknown Error Occured",icon: "error"});
                }
            }
            $("#btn_nadminPIN").removeAttr("disabled");
        },
        "error": function(data)
        {
            $("#btn_nadminPIN").removeAttr("disabled");
            Swal.fire({title: "Oops",text: "Server or Network Failed",icon: "error"});
        }
    });
}
$("#btn_mac").on("click", function(){
    save_update_mac();
});
$("#mac_sig").keyup(function(event){
    if(event.keyCode === 13){
        save_update_mac();
    }
});
$("#mac_id").keyup(function(event){
    if(event.keyCode === 13){
        save_update_mac();
    }
});
$("#mac_url").keyup(function(event){
    if(event.keyCode === 13){
        save_update_mac();
    }
});
function save_update_mac()
{
    let btnml = $("#btn_mac").html();
    $("#btn_mac").attr("disabled", "");
    $("#btn_mac").text("Please Wait ...");
    let payload = "server_url=" + $("#mac_url").val() + "&mac_id=" + $("#mac_id").val() + "&serial=" + $("#mac_serial").val() + "&device_id1=" + $("#mac_dv1").val() + "&device_id2=" + $("#mac_dv2").val() + "&signature=" + $("#mac_sig").val();
    $.ajax({
        "url": "api.php",
        "type": "POST",
        "data": "action=save_mac_portal&" + payload,
        "success": function(data) {
            try { data = JSON.parse(data); }catch(err){}
            if(data.status == "success")
            {
                $("#btn_mac").removeAttr("disabled");
                $("#btn_mac").text(" Save ");
                load_dashboard_data();
                window.setTimeout(function(){ update_mac_data(); }, 2000);
                Swal.fire({title: "OK",text: data.message,icon: "success"});
            }
            else
            {
                if(data.status == "error")
                {
                    Swal.fire({title: "Oops",text: data.message,icon: "warning"});
                }
                else
                {
                    Swal.fire({title: "Oops",text: "Unknown Error Occured",icon: "error"});
                }
            }
            $("#btn_mac").removeAttr("disabled");
            $("#btn_mac").html(btnml);
        },
        "error": function(data)
        {
            $("#btn_mac").removeAttr("disabled");
            $("#btn_mac").html(btnml);
            Swal.fire({title: "Oops",text: "Server or Network Failed",icon: "error"});
        }
    });
}
$("#btn_delete_mac").on("click", function(){
    confirm_mac_deletion();
});
function confirm_mac_deletion()
{
    Swal.fire({
        title: "Do you really want to delete Stalker details?",
        showCancelButton: true,
        confirmButtonText: "Delete",
      }).then((result) => {
        if (result.isConfirmed) {
            delete_mac_data();
        }
      });
}
function delete_mac_data()
{
    let btnml = $("#btn_delete_mac").html();
    $("#btn_delete_mac").attr("disabled", "");
    $("#btn_delete_mac").text("Please Wait ...");
    $.ajax({
        "url": "api.php",
        "type": "POST",
        "data": "action=delete_mac_portal",
        "success": function(data) {
            try { data = JSON.parse(data); }catch(err){}
            if(data.status == "success")
            {
                location.reload();
                Swal.fire({title: "OK",text: data.message,icon: "success"});
            }
            else
            {
                if(data.status == "error")
                {
                    Swal.fire({title: "Oops",text: data.message,icon: "warning"});
                }
                else
                {
                    Swal.fire({title: "Oops",text: "Unknown Error Occured",icon: "error"});
                }
            }
            $("#btn_delete_mac").removeAttr("disabled");
            $("#btn_delete_mac").html(btnml);
        },
        "error": function(data)
        {
            $("#btn_delete_mac").removeAttr("disabled");
            $("#btn_delete_mac").html(btnml);
            Swal.fire({title: "Oops",text: "Server or Network Failed",icon: "error"});
        }
    });
}
function update_mac_data()
{
    Swal.fire({title: "Please Wait ...",text: "Fetching MAC Details !",icon: "info"});
    $.ajax({
        "url": "api.php",
        "type": "POST",
        "data": "action=update_mac_data",
        "success": function(data) {
            try { data = JSON.parse(data); }catch(err){}
            if(data.status == "success")
            {
                load_dashboard_data();
                Swal.fire({title: "OK",text: data.message,icon: "success"});
            }
            else
            {
                if(data.status == "error")
                {
                    Swal.fire({title: "Oops",text: data.message,icon: "warning"});
                }
                else
                {
                    Swal.fire({title: "Oops",text: "Unknown Error Occured",icon: "error"});
                }
            }
        },
        "error": function(data)
        {
            Swal.fire({title: "Oops",text: "Server or Network Failed",icon: "error"});
        }
    });
}

$("#btn_toggle_proxy_status").on("click", function(){
    $("#btn_toggle_proxy_status").attr("disabled", "");
    $("#btn_toggle_proxy_status").html('<i class="fa-solid fa-arrows-rotate"></i>');
    $.ajax({
        "url": "api.php",
        "type": "POST",
        "data": "action=toggle_stream_proxy",
        "success": function(data) {
            try { data = JSON.parse(data); }catch(err){}
            if(data.status == "success")
            {
                load_dashboard_data();
                Swal.fire({title: "OK",text: data.message,icon: "success"});
            }
            else
            {
                if(data.status == "error")
                {
                    Swal.fire({title: "Oops",text: data.message,icon: "warning"});
                }
                else
                {
                    Swal.fire({title: "Oops",text: "Unknown Error Occured",icon: "error"});
                }
            }
            $("#btn_toggle_proxy_status").removeAttr("disabled");
            $("#btn_toggle_proxy_status").html('<i class="fa-solid fa-rotate-right"></i>');
        },
        "error": function(data)
        {
            $("#btn_toggle_proxy_status").removeAttr("disabled");
            $("#btn_toggle_proxy_status").html('<i class="fa-solid fa-rotate-right"></i>');
            Swal.fire({title: "Oops",text: "Server or Network Failed",icon: "error"});
        }
    });
});