const XlsxPopulate = require('xlsx-populate');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const path = require('path');

const fileMutation = async (files, res) => {
  const { first, second, sentido } = files;
  try {
    //const fullName = save(file);
    const base64Data = await noHeaderBase64XLSX(first);
    const base64DataSecond = await noHeaderBase64XLSX(second);
    if (base64Data && base64DataSecond) {
      // Load an existing workbook
      const workbook = await XlsxPopulate.fromDataAsync(base64Data, {
        base64: true,
      });

      const workbook2 = await XlsxPopulate.fromDataAsync(base64DataSecond, {
        base64: true,
      });
      // Modify the workbook.
      const trazabilidadSheet = await workbook.sheet('Trazabilidad');
      const pesoSheet = await workbook2.sheet(`SENTIDO ${sentido}`);
      if (!trazabilidadSheet || !pesoSheet) return res.status(501).send(null);
      const limitSheet = 80000;
      const limitSheet2 = 10000;
      const pesosBasculas = [];
      let continuation = true;
      let continuation2 = true;

      for (let j = 2; j <= limitSheet2 && continuation2; j++) {
        const placa = pesoSheet.cell(`B${j}`).value();
        const fecha = pesoSheet.cell(`H${j}`).value();
        const hora = pesoSheet.cell(`I${j}`).value();
        const peso = pesoSheet.cell(`N${j}`).value();
        const levantado = pesoSheet.cell(`Z${j}`).value();
        if (placa === undefined) {
          continuation2 = false;
        }
        if (levantado === 'SI') {
          pesosBasculas.push({ placa, fecha, hora, peso });
        }
      }

      const rows = [];
      //{placa: ###, info: [{index: #, pago: $}]}
      for (let i = 2; i <= limitSheet && continuation; i++) {
        const fecha = trazabilidadSheet.cell(`A${i}`).value();
        const fechaHora = trazabilidadSheet.cell(`B${i}`).value();
        const placa = trazabilidadSheet.cell(`P${i}`).value();
        const categoria = trazabilidadSheet.cell(`M${i}`).value();
        if (placa === undefined) continuation = false;
        else {
          if (categoria !== 1 && categoria !== 2) {
            let peso = '';
            if (categoria >= 5) {
              const basculaFiltrada = pesosBasculas.filter(
                (pesados) => pesados.placa === placa
              );
              if (basculaFiltrada.length !== 0) {
                const calendario = fechaHora.split(' ');
                const initial = calendario[0].split('/');
                const calendarioFecha = [
                  initial[2],
                  initial[1],
                  initial[0],
                ].join('-');
                const calendarioHora = calendario[1];
                const finalDate = [calendarioFecha, calendarioHora].join(' ');
                const fechaFirst = new Date(finalDate).getTime();
                basculaFiltrada.forEach((basculaFecha) => {
                  const initial2 = basculaFecha.fecha.split('/');
                  const calendarioF = [
                    initial2[2],
                    initial2[1],
                    initial2[0],
                  ].join('-');
                  const fechaSecond = new Date(
                    `${calendarioF} ${basculaFecha.hora}`
                  ).getTime();
                  const diff = fechaFirst + 60 * 60000;
                  if (fechaSecond <= diff && fechaSecond >= fechaFirst) {
                    peso = basculaFecha.peso;
                  }
                });
              }
            }
            const indexed = rows.findIndex((row) => row.placa === placa);
            if (indexed === -1) {
              rows.push({
                placa,
                info: [{ index: i, fecha, fechaHora, categoria, peso }],
              });
            } else {
              const auxRow = Object.assign({}, rows[indexed]);
              const auxInfo = Object.assign([], auxRow.info);
              const exists =
                auxInfo.findIndex((infoIndex) => infoIndex.index === i) !== -1;
              if (!exists) {
                auxInfo.push({ index: i, fecha, fechaHora, categoria, peso });
                auxRow.info = auxInfo;
                if (auxRow.placa === placa) {
                  auxInfo.forEach((infoPay) => {
                    if (infoPay.categoria !== categoria) {
                      auxRow.noIgual = true;
                    }
                  });
                }
                rows[indexed] = auxRow;
              }
            }
          }
        }
      }

      rows.forEach((filter) => {
        const { info } = filter;
        info.forEach((modifySheet) => {
          const { index, peso } = modifySheet;
          if (peso !== '' && peso !== undefined && peso !== null) {
            trazabilidadSheet.cell(`X${index}`).value(peso);
          }
        });
      });

      const filteredNoIgual = rows.filter((rowFilter) => rowFilter.noIgual);
      filteredNoIgual.forEach((filter) => {
        const { info } = filter;
        info.forEach((modifySheet) => {
          const { index } = modifySheet;
          const categoria = trazabilidadSheet.cell(`M${index}`).value();
          switch (categoria) {
            case 1: {
              trazabilidadSheet.cell(`M${index}`).style('fill', '2095F2');
              break;
            }
            case 2: {
              trazabilidadSheet.cell(`M${index}`).style('fill', 'FF5D33');
              break;
            }
            case 3: {
              trazabilidadSheet.cell(`M${index}`).style('fill', 'd8b6df');
              break;
            }
            case 4: {
              trazabilidadSheet.cell(`M${index}`).style('fill', '34c048');
              break;
            }
            case 5: {
              trazabilidadSheet.cell(`M${index}`).style('fill', '3399ff');
              break;
            }
            case 6: {
              trazabilidadSheet.cell(`M${index}`).style('fill', 'ffff00');
              break;
            }
            case 7: {
              trazabilidadSheet.cell(`M${index}`).style('fill', '74C964');
              break;
            }
          }
        });
      });

      const newFile = await workbook.outputAsync('base64');

      const base64DataResponse =
        'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' +
        newFile;
      await res.setHeader('content-type', 'text/plain');
      await res.status(200).send(base64DataResponse);
    } else {
      await res.status(502).send(null);
    }
  } catch (error) {
    console.log(error);
    await res.status(500).send(error);
  }
};

module.exports = { fileMutation };

const save = (file) => {
  try {
    const base64Data = noHeaderBase64XLSX(file);
    const name = `${uuid()}.xlsx`;
    const baseFile = path.resolve(__dirname, 'files');
    if (!fs.existsSync(baseFile)) fs.mkdirSync(baseFile);
    const fullName = path.join(baseFile, name);
    fs.writeFileSync(fullName, base64Data, (err) => {
      if (err) console.log('err', err);
    });
    return fullName;
  } catch (error) {
    return { error };
  }
};

const checkFile = (name) => {
  if (!fs.existsSync(name)) return checkFile(name);
  return true;
};

const noHeaderBase64XLSX = (file) => {
  return file.replace(
    /^data:application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,/,
    ''
  );
};
