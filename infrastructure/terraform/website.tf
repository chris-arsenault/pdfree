locals {
  headers = jsondecode(file("${path.module}/../../frontend/security-headers.json"))
}

resource "aws_cloudfront_response_headers_policy" "editor" {
  name = "pdfree-editor"
  security_headers_config {
    content_security_policy {
      content_security_policy = local.headers["Content-Security-Policy"]
      override                = true
    }
    content_type_options { override = true }
    frame_options {
      frame_option = local.headers["X-Frame-Options"]
      override     = true
    }
    referrer_policy {
      referrer_policy = local.headers["Referrer-Policy"]
      override        = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      override                   = true
    }
  }
  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = local.headers["Permissions-Policy"]
      override = true
    }
  }
}

module "website" {
  source = "git::https://github.com/chris-arsenault/ahara-tf-patterns.git//modules/website?ref=3b311dcc621a8cb5e82a775660dee916a3650e73"

  prefix                     = "pdfree"
  hostname                   = "pdf.ahara.io"
  site_directory             = "${path.module}/../../frontend/dist"
  response_headers_policy_id = aws_cloudfront_response_headers_policy.editor.id
  encrypt                    = false
}

# Only public application assets are hosted. PDF documents remain on the device.
resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = module.website.bucket_name
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

output "url" { value = module.website.url }
output "bucket_name" { value = module.website.bucket_name }
output "distribution_id" { value = module.website.distribution_id }
