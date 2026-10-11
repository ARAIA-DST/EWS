function setupTalentAddon(){
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const props=PropertiesService.getScriptProperties(),id=props.getProperty('SPREADSHEET_ID');if(!id)throw new Error('Jalankan setupSheets untuk aplikasi NC yang sudah ada terlebih dahulu.');
    const book=SpreadsheetApp.openById(id);
    Object.keys(TalentCore.SCHEMA).forEach(name=>{
      const headers=TalentCore.SCHEMA[name];let sheet=book.getSheetByName(name);
      if(sheet){const current=sheet.getRange(1,1,1,headers.length).getValues()[0];if(headers.some((h,i)=>current[i]!==h))throw new Error('Sheet '+name+' memiliki header berbeda. Data tidak diubah. Periksa panduan add-on.');return;}
      sheet=book.insertSheet(name);if(sheet.getMaxColumns()<headers.length)sheet.insertColumnsAfter(sheet.getMaxColumns(),headers.length-sheet.getMaxColumns());sheet.getRange(1,1,1,headers.length).setValues([headers]).setBackground('#0A0A0B').setFontColor('#FFFFFF').setFontWeight('bold');sheet.setFrozenRows(1);sheet.getRange(2,1,sheet.getMaxRows()-1,headers.length).setNumberFormat('@');
    });
    if(!props.getProperty('TALENT_PHOTO_FOLDER_ID')){const folder=DriveApp.createFolder('ARAIA — Foto Profil SPG');props.setProperty('TALENT_PHOTO_FOLDER_ID',folder.getId());}
    props.setProperty('TALENT_EPOCH',Utilities.getUuid());console.log('Add-on siap. Sheet NC, akun, skor dan riwayat lama tetap tersedia.');return{tables:Object.keys(TalentCore.SCHEMA),photoFolderId:props.getProperty('TALENT_PHOTO_FOLDER_ID')};
  }finally{lock.releaseLock();}
}
function checkTalentAIConfiguration(){
  const status=talentAIStatus_();console.log(status.enabled?'AI siap digunakan dari menu AI Insight & Analytics.':'AI belum aktif: '+status.message);return status;
}
