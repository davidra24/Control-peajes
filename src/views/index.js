const button = document.getElementById('button-upload');
const cargando = document.getElementById('cargando');

function onLoad() {
  handleLoading(false);
}

function handleLoading(isVisible) {
  cargando.style.visibility = isVisible ? 'visible' : 'hidden';
}

button.addEventListener('click', () => {
  const file = document.getElementById('file-upload');
  const xlsx = file.files[0];
  console.log('xlsx', xlsx);
  if (xlsx) {
    handleLoading(true);
    toBase64(xlsx).then((body) => {
      fetch('/upload', {
        method: 'POST',
        body: body,
        headers: {
          'Content-Type': 'text/plain',
        },
      })
        .then(async (res) => {
          if (res.status === 200) {
            return res.text();
          } else if (res.satus === 510) {
            alert('El nombre de la hoja debe ser "Trazabilidad"');
            handleLoading(false);
          } else {
            alert('Ocurrió un problema al subir el archivo');
            handleLoading(false);
          }
        })
        .then((result) => {
          //const result = await res.text();
          toXLSX(result);
          file.value = '';
          handleLoading(false);
        });
    });
  } else {
    alert('no permitido');
  }
});

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

function toXLSX(file) {
  const anchor = document.createElement('a');
  const myFile = document.getElementById('file-upload');

  const url = file; //URL.createObjectURL(blob);
  anchor.href = url; //URL.createObjectURL(file);
  anchor.style.display = 'none';
  anchor.download = myFile.files[0].name;
  //anchor.target = '__blank';
  anchor.click();
}

function s2ab(s) {
  var buf = new ArrayBuffer(s.length);
  var view = new Uint8Array(buf);
  for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
  return buf;
}
