const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/convert", async (req, res) => {
  try {

    const pdfUrl = req.body.pdf_url;

    if (!pdfUrl) {
      return res.status(400).json({
        error: "Missing pdf_url"
      });
    }

    // Download PDF
    const response = await axios({
      url: pdfUrl,
      method: "GET",
      responseType: "stream"
    });

    const inputPath = "./input.pdf";
    const outputPath = "./output.pdf";

    const writer = fs.createWriteStream(inputPath);

    response.data.pipe(writer);

    writer.on("error", (err) => {
      console.error('Error writing PDF file:', err);
      return res.status(500).json({ error: "Failed to download PDF" });
    });

    writer.on("finish", () => {

      console.log("PDF downloaded");

      // Ghostscript command: preserve raw images and disable downsampling/recompression
      const command = [
        'gs',
        '-dSAFER',
        '-dBATCH',
        '-dNOPAUSE',
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.7',
        '-dPreserveRawImages=true',
        '-dAutoFilterColorImages=false',
        '-dAutoFilterGrayImages=false',
        '-dAutoFilterMonoImages=false',
        '-dDownsampleColorImages=false',
        '-dDownsampleGrayImages=false',
        '-dDownsampleMonoImages=false',
        '-sProcessColorModel=DeviceCMYK',
        '-sColorConversionStrategy=CMYK',
        `-sOutputFile=${outputPath}`,
        inputPath
      ].join(' ');

      exec(command, (error, stdout, stderr) => {

        if (error) {

          console.error(stderr || error);

          return res.status(500).json({
            error: "Ghostscript conversion failed",
            details: stderr || String(error)
          });

        }

        console.log("Conversion completed");

        res.download(outputPath, (err) => {
          if (err) console.error('Error sending file:', err);
        });

      });

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});