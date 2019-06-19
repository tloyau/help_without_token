const xapi = require('xapi');

const BOT_TOKEN = "NTg1YjZkYjgtNGQyMC00ZDQwLTg5MDMtY2Q4NDc3MGQ4ODI4NGUzOGNkYjktMzU5_PF84_8baf43b1-205a-4ba8-a51a-7b0c02751395"
const SPACE_ID = "Y2lzY29zcGFyazovL3VzL1JPT00vODNmYzFmNjAtOTI3OC0xMWU5LTk2NDktYzVjY2ZmODU2MzEz"

var systemInfo = {
    systemName: ''
  , softwareVersion: ''
  , softwareReleaseDate: ''
  , videoMonitors: ''
  , ip: ''
  , sip: ''
};

var msg;


function push(msg, cb) {

    // Post message
    let payload = {
        "markdown": msg,
        "roomId": SPACE_ID
    }
    xapi.command(
        'HttpClient Post',
        {
            Header: ["Content-Type: application/json", "Authorization: Bearer " + BOT_TOKEN],
            Url: "https://api.ciscospark.com/v1/messages",
            AllowInsecureHTTPS: "True"
        },
        JSON.stringify(payload))
        .then((response) => {
            if (response.StatusCode == 200) {
                console.log("message pushed to Webex Teams");
                if (cb) cb(null);
                return;
            }
        })
        .catch((err) => {
            console.log("failed: " + err.message)
            if (cb) cb("Could not post message to Webex Teams")
        })
}

xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
    if(event.PanelId == 'help'){
        xapi.command("UserInterface Message Prompt Display", {
          Text: 'Choisissez une option :',
          FeedbackId: 'help_step1',
          'Option.1': 'Reporter un problème',
          'Option.2': 'Appeler le support'
        }).catch((error) => { console.error(error); });
    }
});


xapi.event.on('UserInterface Message TextInput Response', (event) => {
    switch(event.FeedbackId){
        case 'help_step2_issue':
          xapi.command("UserInterface Message Alert Display", {
              Title: 'Problème reporté'
              , Text: 'Merci pour votre participaton.'
              , Duration: 3
          }).catch((error) => { console.error(error); });
          
          xapi.status.get('Diagnostics Message').then(list => {
            let diagnostics = "\n\n";
            
            for (let element in list) {
              diagnostics += `Diagnostic ${(element)} => description : **${JSON.stringify(list[element].Description)}**\n\n`;
            }
            
            diagnostics += "-----\n\n"
            
            msg = `-----\n\n**Probleme #${Math.round(Math.random() * 10000)}**\n\nCodec _${systemInfo.systemName}_\n\nIP : ${systemInfo.ip}\n\nSIP : ${systemInfo.sip}\n\nDescription : **${event.Text}**`;
            
            push(msg);
            
            setTimeout(() => {
              push(diagnostics);
            }, 2000);
          });
          break;
    }
});


xapi.event.on('UserInterface Message Prompt Response', (event) => {
    switch(event.FeedbackId){
        case 'help_step1':
          switch(event.OptionId){
             case '1':
                xapi.command("UserInterface Message TextInput Display", {
                          Duration: 0
                        , FeedbackId: "help_step2_issue"
                        , InputType: "SingleLine"
                        , KeyboardState: "Open"
                        , Placeholder: "Ecrivez ici"
                        , SubmitText: "Soumettre"
                        , Text: "Veuillez décrire le problème"
                        , Title: "Reporter un problème"
                  }).catch((error) => { console.error(error); });
                  break;
              case '2':
                xapi.command("Dial", {
                  "Number": "demo@ciscofrance.com"
                });
                break;
          }
          break;
    }
});


function init(){
  xapi.status.get('SystemUnit Software Version').then((value) => {
    systemInfo.softwareVersion = value;
  });
  xapi.status.get('UserInterface ContactInfo Name').then((value) => {
    systemInfo.systemName = value;
  });
  xapi.status.get('SystemUnit Software ReleaseDate').then((value) => {
    systemInfo.softwareReleaseDate = value;
  });
  xapi.status.get('Video Monitors').then((value) => {
   systemInfo.videoMonitors = value;
  });
  xapi.status.get('Network 1 IPv4 Address').then((value) => {
   systemInfo.ip = value;
  });
  xapi.status.get('UserInterface ContactInfo ContactMethod 1 Number').then((value) => {
   systemInfo.sip = value;
  });
}

init();