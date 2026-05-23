package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.res.FileResponse;
import com.fwb.restaurant.service.FileService;
import com.fwb.restaurant.utils.annotations.ApiMessage;
import com.fwb.restaurant.utils.error.StorageException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URISyntaxException;

@RestController
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/files")
    @ApiMessage("Upload single file")
    public ResponseEntity<FileResponse> upload(
            @RequestParam(name = "file", required = false) MultipartFile file,
            @RequestParam("folder") String folder
    ) throws URISyntaxException, IOException {
        this.fileService.validate(file);
        this.fileService.createUploadFolder(folder);

        return ResponseEntity.ok(FileResponse.builder()
                .fileName(this.fileService.store(file, folder))
                .build());
    }

}
