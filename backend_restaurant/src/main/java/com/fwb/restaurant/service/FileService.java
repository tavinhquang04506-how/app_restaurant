package com.fwb.restaurant.service;

import com.fwb.restaurant.utils.error.StorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;

@Service
public class FileService {
    @Value("${fwb.upload-file.base-uri}")
    private String baseUri;

    public void createUploadFolder(String folder) throws URISyntaxException {
        URI uri = new URI(baseUri + folder);
        Path path = Paths.get(uri);
        File tmpDir = new File(path.toString());
        if (!tmpDir.isDirectory()) {
            try {
                Files.createDirectory(tmpDir.toPath());
                System.out.println(">>> CREATE NEW DIRECTORY SUCCESSFUL, PATH = " + folder);
            } catch (IOException e) {
                e.printStackTrace();
            }
        } else {
            System.out.println(">>> SKIP MAKING DIRECTORY, ALREADY EXISTS");
        }
    }

    public String store(MultipartFile file, String folder) throws URISyntaxException, IOException {
        // create unique filename
        String finalName = System.currentTimeMillis() + "-" + file.getOriginalFilename();

        URI uri = new URI(baseUri + folder + "/" + finalName);
        Path path = Paths.get(uri);
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, path,
                    StandardCopyOption.REPLACE_EXISTING);
        }

        return finalName;
    }

    public void validate(MultipartFile file) {
        if(file == null || file.isEmpty()) {
            throw new StorageException("File trống vui lòng truyền file lên...");
        }

        String fileName = file.getOriginalFilename();
        List<String> allowedExtensions = Arrays.asList("pdf", "jpg", "jpeg", "png", "doc", "docx");
        boolean isValidExtension =
                allowedExtensions.stream().anyMatch(ext -> fileName.toLowerCase().endsWith("." + ext));
        if(!isValidExtension) {
            throw new StorageException("Vui lòng truyền file có dạng [pdf, jpg, jpeg, png]");
        }
    }


}
